'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function OnboardingForm({ userId }: { userId: string }) {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, nickname: nickname.trim() }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="text"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="输入你的昵称"
        className="bg-zinc-900 border-zinc-800 text-white text-center text-lg"
        maxLength={20}
      />
      <Button
        type="submit"
        disabled={loading || !nickname.trim()}
        className="w-full bg-amber-400 text-zinc-900 hover:bg-amber-500"
      >
        {loading ? '保存中...' : '开始聊天'}
      </Button>
    </form>
  );
}
