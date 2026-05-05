import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { messages } from '@/db/schema';
import { eq, and, desc, lt } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get('characterId');
  const cursor = searchParams.get('cursor');
  const limit = 30;

  if (!characterId) {
    return NextResponse.json({ error: 'Missing characterId' }, { status: 400 });
  }

  let result;
  if (cursor) {
    const cursorDate = new Date(parseInt(cursor));
    result = await db
      .select()
      .from(messages)
      .where(and(
        eq(messages.userId, session.user.id),
        eq(messages.characterId, characterId),
        lt(messages.createdAt, cursorDate)
      ))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  } else {
    result = await db
      .select()
      .from(messages)
      .where(and(
        eq(messages.userId, session.user.id),
        eq(messages.characterId, characterId)
      ))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
  }

  return NextResponse.json(result.reverse());
}
