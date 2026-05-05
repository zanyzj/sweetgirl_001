import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { nickname } = await request.json();

    if (!nickname) {
      return NextResponse.json({ error: 'Missing nickname' }, { status: 400 });
    }

    const [existingProfile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, session.user.id))
      .limit(1);

    if (existingProfile) {
      await db.update(userProfiles)
        .set({ nickname, updatedAt: new Date() })
        .where(eq(userProfiles.id, existingProfile.id));
    } else {
      await db.insert(userProfiles).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        nickname,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
