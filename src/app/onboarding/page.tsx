'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function OnboardingPage() {
  const [nickname, setNickname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      
      if (response.ok) {
        window.location.href = "/characters";
      }
    } catch (error) {
      console.error("Failed to set nickname:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          她应该怎么称呼你？
        </h1>
        <p className="text-zinc-400 text-center mb-8">
          给你自己起个好听的昵称吧
        </p>
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="请输入昵称"
            className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 mb-6"
            maxLength={50}
          />
          <Button
            type="submit"
            disabled={!nickname.trim() || isSubmitting}
            className="w-full bg-amber-400 hover:bg-amber-500 text-zinc-900 text-lg py-6"
          >
            {isSubmitting ? "提交中..." : "确定"}
          </Button>
        </form>
      </div>
    </main>
  );
}
