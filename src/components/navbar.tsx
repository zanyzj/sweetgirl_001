'use client';

import { authClient } from '@/lib/auth/client';
import { useState, useEffect } from 'react';

export function Navbar() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await authClient.getSession();
      setSession(data);
      setLoading(false);
    };
    fetchSession();
  }, []);

  const handleLogin = () => {
    authClient.signIn.social({ provider: 'google' });
  };

  const handleLogout = async () => {
    await authClient.signOut();
    setSession(null);
    window.location.href = '/';
  };

  if (loading) {
    return (
      <nav className="bg-zinc-900 border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-amber-400">虚拟女友</span>
            <div className="w-24 h-5 bg-zinc-800 rounded-full animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  const isLoggedIn = !!session?.user;

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-amber-400 hover:text-amber-300 transition-colors">
            虚拟女友
          </a>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded-full">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-green-400 text-sm font-medium">已登录</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-full transition-colors"
                >
                  退出登录
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-900 font-medium rounded-full transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>登录</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}