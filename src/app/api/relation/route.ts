import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userCharacterRelations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const characterId = searchParams.get('characterId');

  if (!userId || !characterId) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const relation = await db
    .select()
    .from(userCharacterRelations)
    .where(and(
      eq(userCharacterRelations.userId, userId),
      eq(userCharacterRelations.characterId, characterId)
    ))
    .limit(1);

  if (relation.length === 0) {
    const now = new Date();
    const newRelation = {
      id: crypto.randomUUID(),
      userId,
      characterId,
      affection: 10,
      stage: 'stranger',
      lastChatAt: now,
      consecutiveDays: 0,
      todayAddition: 0,
      todayDeduction: 0,
      countersResetDate: now.toISOString().split('T')[0],
    };
    await db.insert(userCharacterRelations).values(newRelation);
    return NextResponse.json(newRelation);
  }

  return NextResponse.json(relation[0]);
}
