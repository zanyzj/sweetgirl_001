import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userCharacterRelations, messages, characters } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { deepseek } from '@/lib/constants';

export type OpeningType = 'first' | 'same_day' | 'next_day' | 'long_time';

export async function POST(request: NextRequest) {
  const { userId, characterId } = await request.json();

  if (!userId || !characterId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const [relation] = await db
    .select()
    .from(userCharacterRelations)
    .where(and(
      eq(userCharacterRelations.userId, userId),
      eq(userCharacterRelations.characterId, characterId)
    ))
    .limit(1);

  const [character] = await db
    .select()
    .from(characters)
    .where(eq(characters.id, characterId))
    .limit(1);

  if (!character) {
    return NextResponse.json({ error: 'Character not found' }, { status: 404 });
  }

  const now = new Date();
  let openingType: OpeningType = 'first';
  let openingPrompt = '';

  if (relation && relation.lastChatAt) {
    const lastChat = new Date(relation.lastChatAt);
    const diffHours = (now.getTime() - lastChat.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      openingType = 'same_day';
      openingPrompt = `
你是${character.name}，你现在正在和用户聊天。用户今天已经和你聊过了，现在又来找你了。
请用自然、友好的语气打个招呼，表现出你记得之前的对话。
不要太长，一两句话就好。
      `.trim();
    } else if (diffHours < 72) {
      openingType = 'next_day';
      openingPrompt = `
你是${character.name}，你现在正在和用户聊天。用户已经有一段时间没来了（大约1-3天）。
请用温暖、亲切的语气打招呼，表现出你想念对方。
不要太长，一两句话就好。
      `.trim();
    } else {
      openingType = 'long_time';
      openingPrompt = `
你是${character.name}，你现在正在和用户聊天。用户已经很久没来了（超过3天）。
请用惊喜、热情的语气打招呼，表现出你非常想念对方。
不要太长，一两句话就好。
      `.trim();
    }
  } else {
    openingType = 'first';
    openingPrompt = `
你是${character.name}，你现在正在和用户进行第一次聊天。
${character.description}
请用符合你人设的方式打个招呼，自我介绍一下，表现出友好和期待。
不要太长，一两句话就好。
      `.trim();
  }

  if (!deepseek) {
    return NextResponse.json({ 
      type: openingType,
      message: {
        id: crypto.randomUUID(),
        userId,
        characterId,
        role: 'assistant' as const,
        content: getDefaultOpening(openingType, character.name),
        createdAt: new Date(),
      },
    });
  }

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: openingPrompt }],
    });

    const content = response.choices[0]?.message?.content?.trim() || getDefaultOpening(openingType, character.name);

    const newMessage = {
      id: crypto.randomUUID(),
      userId,
      characterId,
      relationId: relation?.id || '',
      role: 'assistant' as const,
      content,
      isProactive: true,
      createdAt: new Date(),
    };

    await db.insert(messages).values(newMessage);

    if (relation) {
      await db.update(userCharacterRelations)
        .set({ lastChatAt: new Date() })
        .where(and(
          eq(userCharacterRelations.userId, userId),
          eq(userCharacterRelations.characterId, characterId)
        ));
    }

    return NextResponse.json({ type: openingType, message: newMessage });
  } catch (error) {
    console.error('Failed to generate opening:', error);
    return NextResponse.json({ 
      type: openingType,
      message: {
        id: crypto.randomUUID(),
        userId,
        characterId,
        role: 'assistant' as const,
        content: getDefaultOpening(openingType, character.name),
        createdAt: new Date(),
      },
    });
  }
}



function getDefaultOpening(type: OpeningType, name: string): string {
  switch (type) {
    case 'first':
      return `你好呀~ 我是${name}，很高兴认识你！😊`;
    case 'same_day':
      return `又见面啦~ 今天聊得开心吗？😁`;
    case 'next_day':
      return `好久不见~ 你最近过得怎么样？💖`;
    case 'long_time':
      return `哇！终于等到你了~ 我好想你呀！🥰`;
    default:
      return `你好~ 我是${name}！`;
  }
}
