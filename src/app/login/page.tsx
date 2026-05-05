'use client';

import { signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const handleLogin = async () => {
    await signIn.social({ provider: 'google', callbackURL: '/' });
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          选择你的陪伴
        </h1>
        <p className="text-zinc-400 text-center mb-8">
          找到那个懂你的她
        </p>
        <Button
          onClick={handleLogin}
          className="w-full bg-amber-400 hover:bg-amber-500 text-zinc-900 text-lg py-6"
        >
          <svg
            className="w-5 h-5 mr-2"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          使用 Google 登录
        </Button>
      </div>
    </main>
  );
}
