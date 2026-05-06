import { db } from '@/db';
import { messages } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { IMAGE_PROBABILITY, MAX_DAILY_IMAGES_PER_CHARACTER } from '@/lib/constants';
import { Stage } from '@/lib/constants';

export interface ShouldSendImageParams {
  characterId: string;
  userId: string;
  currentStage: Stage;
}

export async function shouldSendImage({
  characterId,
  userId,
  currentStage,
}: ShouldSendImageParams): Promise<boolean> {
  const probability = IMAGE_PROBABILITY[currentStage];
  
  console.log('[Image Decision] 输入参数:', {
    characterId,
    userId,
    currentStage,
    probability,
    probabilityPercent: probability * 100 + '%',
  });
  
  if (probability === 0) {
    console.log('[Image Decision] 概率为0，直接返回 false');
    return false;
  }

  const today = new Date().toISOString().split('T')[0];
  
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(
      and(
        eq(messages.userId, userId),
        eq(messages.characterId, characterId),
        sql`image_url IS NOT NULL`,
        sql`DATE(created_at) = ${today}`
      )
    );

  const todayImageCount = result[0]?.count || 0;

  console.log('[Image Decision] 今日已发图数量:', todayImageCount, '/', MAX_DAILY_IMAGES_PER_CHARACTER);
  
  if (todayImageCount >= MAX_DAILY_IMAGES_PER_CHARACTER) {
    console.log('[Image Decision] 今日图片已达上限，返回 false');
    return false;
  }

  const random = Math.random();
  const shouldSend = random < probability;

  console.log('[Image Decision] 随机数计算:', {
    random: random.toFixed(4),
    probability,
    probabilityPercent: probability * 100 + '%',
    comparison: `${random.toFixed(4)} < ${probability} = ${shouldSend}`,
    shouldSend,
  });

  return shouldSend;
}
