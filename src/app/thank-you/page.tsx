import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export default async function ThankYouPage() {
  const session = await auth.api.getSession({ headers: headers() });
  
  if (!session?.user) {
    redirect('/login');
  }

  await db.update(userProfiles)
    .set({ isPro: true })
    .where(eq(userProfiles.userId, session.user.id));

  return (
    <main className="min-h-screen p-8 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">支付成功！</h1>
        <p className="text-zinc-400 mb-8">
          恭喜您升级为 Pro 用户！您现在可以享受所有高级功能。
        </p>
        <a 
          href="/" 
          className="inline-flex items-center px-6 py-3 bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold rounded-lg transition-colors"
        >
          返回首页
        </a>
      </div>
    </main>
  );
}