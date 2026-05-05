'use client';

import { useState, useRef, useEffect } from 'react';
import { Character, Message } from '@/db/schema';
import { getStageName, getStageFromAffection } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

interface ChatPageProps {
  character: Character;
  userId: string;
}

export function ChatPage({ character, userId }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [affection, setAffection] = useState(10);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages();
    loadRelation();
  }, [character.id, userId]);

  const loadMessages = async () => {
    const res = await fetch(`/api/messages?characterId=${character.id}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  };

  const loadRelation = async () => {
    const res = await fetch(`/api/relation?userId=${userId}&characterId=${character.id}`);
    if (res.ok) {
      const data = await res.json();
      setAffection(data.affection || 10);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        userId,
        characterId: character.id,
        role: 'user',
        content: userMessage,
        createdAt: new Date(),
      } as Message,
    ]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: character.id, content: userMessage }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          userId,
          characterId: character.id,
          role: 'assistant',
          content: '',
          createdAt: new Date(),
        } as Message,
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'text') {
                assistantMessage += parsed.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg && lastMsg.role === 'assistant') {
                    lastMsg.content = assistantMessage;
                  }
                  return updated;
                });
              }
            } catch {}
          }
        }
      }

      await loadMessages();
      await loadRelation();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const stage = getStageFromAffection(affection);
  const stageName = getStageName(stage);

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      <header className="flex items-center gap-4 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="font-bold text-white">{character.name}</h1>
          <p className="text-xs text-zinc-400">{stageName} · 好感度 {affection}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xl">
          {character.id === 'sister' && '🧡'}
          {character.id === 'cute' && '🍑'}
          {character.id === 'cool' && '❄️'}
          {character.id === 'teacher' && '📚'}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <p>开始和 {character.name} 聊天吧~</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-amber-400 text-zinc-900 rounded-br-md'
                  : 'bg-zinc-800 text-white rounded-bl-md'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.imageUrl && (
                <img
                  src={message.imageUrl}
                  alt="character sent"
                  className="mt-2 rounded-lg max-w-full"
                />
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 text-white rounded-2xl rounded-bl-md px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 bg-zinc-900 border-t border-zinc-800">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white shrink-0"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="发送消息..."
            className="flex-1 bg-zinc-800 border-zinc-700 text-white"
            maxLength={500}
            disabled={loading}
          />
          <Button
            type="submit"
            size="icon"
            className="bg-amber-400 text-zinc-900 hover:bg-amber-500 shrink-0"
            disabled={loading || !input.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
