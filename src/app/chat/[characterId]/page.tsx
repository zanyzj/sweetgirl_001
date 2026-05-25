import { auth } from '@/lib/auth';
import { db } from '@/db';
import { characters, userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { ChatPage } from '@/components/chat-page';

export default async function ChatRoute({ params }: { params: { characterId: string } }) {
  const session = await auth.api.getSession({ headers: headers() });

  if (!session || !session.user) {
    redirect('/login');
  }

  const userProfile = await db.select().from(userProfiles).where(eq(userProfiles.userId, session.user.id)).limit(1);
  
  if (!userProfile[0]?.nickname) {
    redirect('/onboarding');
  }

  const [character] = await db
    .select()
    .from(characters)
    .where(eq(characters.id, params.characterId))
    .limit(1);

  if (!character) {
    redirect('/');
  }

  const isPro = userProfile[0]?.isPro || false;
  return <ChatPage character={character} userId={session.user.id} isPro={isPro} />;
}
