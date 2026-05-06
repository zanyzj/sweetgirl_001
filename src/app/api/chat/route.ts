import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { messages, characters, userCharacterRelations, userProfiles } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { deepseek, getStageName, getStageFromAffection } from '@/lib/constants';
import { shouldSendImage } from '@/lib/ai/image-decision';
import { pickImage } from '@/lib/ai/image-picker';

interface ProfileInfo {
  nickname?: string;
  birthday?: string;
  hobbies?: string[];
  favoriteFood?: string;
  job?: string;
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { characterId, content } = await request.json();

  if (!characterId || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (content.length > 500) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 });
  }

  const userId = session.user.id;

  const [character] = await db
    .select()
    .from(characters)
    .where(eq(characters.id, characterId))
    .limit(1);

  if (!character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  }

  let [relation] = await db
    .select()
    .from(userCharacterRelations)
    .where(and(
      eq(userCharacterRelations.userId, userId),
      eq(userCharacterRelations.characterId, characterId)
    ))
    .limit(1);

  if (!relation) {
    const newRelation = {
      id: crypto.randomUUID(),
      userId,
      characterId,
      affection: 10,
      stage: 'stranger',
      consecutiveDays: 0,
      todayAddition: 0,
      todayDeduction: 0,
      countersResetDate: new Date().toISOString().split('T')[0],
    };
    await db.insert(userCharacterRelations).values(newRelation);
    relation = newRelation as typeof relation;
  }

  const recentMessages = await db
    .select()
    .from(messages)
    .where(and(
      eq(messages.userId, userId),
      eq(messages.characterId, characterId)
    ))
    .orderBy(desc(messages.createdAt))
    .limit(15);

  const historyText = recentMessages
    .reverse()
    .map((m) => `${m.role === 'user' ? '用户' : character.name}: ${m.content}`)
    .join('\n');

  const [existingProfile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const stage = getStageFromAffection(relation.affection ?? 10);
  const stageName = getStageName(stage);
  const nickname = existingProfile?.nickname || '你';

  const profileInfo: ProfileInfo = {};
  if (existingProfile) {
    if (existingProfile.birthday) profileInfo.birthday = existingProfile.birthday;
    if (existingProfile.hobbies) profileInfo.hobbies = existingProfile.hobbies as unknown as string[];
    if (existingProfile.favoriteFood) profileInfo.favoriteFood = existingProfile.favoriteFood;
    if (existingProfile.job) profileInfo.job = existingProfile.job;
  }

  const systemPrompt = `${character.systemPrompt}

当前好感度阶段: ${stageName} (${relation.affection}/100)
称呼: ${nickname}
用户信息: ${Object.keys(profileInfo).length > 0 ? JSON.stringify(profileInfo) : '暂无'}

要求:
1. 严格遵循角色设定，保持一致的说话风格
2. 根据好感度阶段调整亲密度
3. 回复字数控制在50-200字
4. 在合适时机展现角色的关心和情感`;

  const fullPrompt = historyText
    ? `${systemPrompt}\n\n最近的对话:\n${historyText}\n\n用户: ${content}`
    : `${systemPrompt}\n\n用户: ${content}`;

  const userMessageId = crypto.randomUUID();
  const currentAffection = relation.affection ?? 10;
  await db.insert(messages).values({
    id: userMessageId,
    userId,
    characterId,
    relationId: relation.id,
    role: 'user',
    content,
    affectionDelta: 2,
    affectionAfter: currentAffection + 2,
  });

  await db.update(userCharacterRelations)
    .set({
      affection: currentAffection + 2,
      lastChatAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(userCharacterRelations.id, relation.id));

  if (!deepseek) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
  }

  const stream = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: fullPrompt }],
    stream: true,
  });

  const encoder = new TextEncoder();
  let assistantContent = '';

  const streamable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            assistantContent += text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', text })}\n\n`));
          }
        }
        
        // 文本流完成后，先保存文本消息
        const assistantMessageId = crypto.randomUUID();
        await db.insert(messages).values({
          id: assistantMessageId,
          userId,
          characterId,
          relationId: relation.id,
          role: 'assistant',
          content: assistantContent,
          affectionDelta: 2,
          affectionAfter: currentAffection + 2,
        });
        
        extractProfileInfo(userId, content).catch(console.error);
        
        console.log('[Chat Route] Text response saved, checking if should send image...');
        
        const shouldSend = await shouldSendImage({
          characterId,
          userId,
          currentStage: stage,
        });
        
        console.log('[Chat Route] shouldSendImage result:', shouldSend);
        
        if (shouldSend) {
          console.log('[Chat Route] Sending generating_image event to client');
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'generating_image' })}\n\n`));
          
          try {
            console.log('[Chat Route] Starting image generation...');
            const imageUrl = await pickImage({ characterId });
            console.log('[Chat Route] pickImage returned:', imageUrl ? 'URL received' : 'null');
            
            if (imageUrl) {
              const imageMessageId = crypto.randomUUID();
              await db.insert(messages).values({
                id: imageMessageId,
                userId,
                characterId,
                relationId: relation.id,
                role: 'assistant',
                content: '',
                imageUrl,
                isProactive: true,
                affectionDelta: 0,
                affectionAfter: currentAffection + 2,
              });
              
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'image', url: imageUrl })}\n\n`));
              console.log('[Chat Route] Image sent via SSE:', imageUrl);
            } else {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'image_failed' })}\n\n`));
              console.log('[Chat Route] Image generation returned null');
            }
          } catch (imageError) {
            console.error('[Chat Route] Image generation error:', imageError);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'image_failed' })}\n\n`));
          }
        } else {
          console.log('[Chat Route] Image not triggered (probability or limit)');
        }
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        controller.close();
        console.log('[Chat Route] Stream closed');
      } catch (error) {
        console.error('[Chat Route] Stream error:', error);
        controller.error(error);
      }
    },
  });

  return new Response(streamable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function extractProfileInfo(userId: string, content: string) {
  if (!deepseek) return;

  const extractPrompt = `从以下用户消息中提取个人信息(生日、爱好、职业、喜欢的食物等)，以JSON格式返回。如果没提取到任何信息，返回空JSON {}。
用户消息: ${content}

返回格式: {"birthday": "...", "hobbies": "...", "favoriteFood": "...", "job": "..."}`;

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: extractPrompt }],
    });

    const extracted = response.choices[0]?.message?.content;
    if (!extracted) return;

    const info = JSON.parse(extracted);

    const [existingProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    const updates: Partial<ProfileInfo> = {};
    if (info.birthday) updates.birthday = info.birthday;
    if (info.hobbies) updates.hobbies = info.hobbies;
    if (info.favoriteFood) updates.favoriteFood = info.favoriteFood;
    if (info.job) updates.job = info.job;

    if (Object.keys(updates).length === 0) return;

    if (existingProfile) {
      await db.update(userProfiles)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userProfiles.id, existingProfile.id));
    }
  } catch (error) {
    console.error('Profile extraction failed:', error);
  }
}
