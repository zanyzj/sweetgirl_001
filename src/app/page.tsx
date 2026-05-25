import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/db';
import { characters, userProfiles } from '@/db/schema';
import { CharacterCard } from '@/components/character-card';
import { PricingTable } from '@/components/pricing-table';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: headers() });

  if (!session || !session.user) {
    redirect('/login');
  }

  const userProfile = await db.select().from(userProfiles).where(eq(userProfiles.userId, session.user.id)).limit(1);
  
  if (!userProfile[0]?.nickname) {
    redirect('/onboarding');
  }

  const allCharacters = await db.select().from(characters);
  const isPro = userProfile[0]?.isPro || false;

  return (
    <main className="min-h-screen">
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-amber-400 mb-8 text-center">
            选择你的陪伴对象
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {allCharacters.map((character) => (
              <CharacterCard key={character.id} character={character} userId={session.user.id} />
            ))}
          </div>
        </div>
      </div>
      
      <PricingTable userId={session.user.id} isPro={isPro} />
    </main>
  );
}
