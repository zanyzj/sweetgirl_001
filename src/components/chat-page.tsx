'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Character, Message } from '@/db/schema';
import { getStageName, getStageFromAffection } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Image as ImageIcon, Camera } from 'lucide-react';
import Link from 'next/link';
import { ChatLimitWarning } from './chat-limit-warning';

interface ExtendedMessage extends Message {
  isGeneratingImage?: boolean;
  isLocal?: boolean;
}

interface ChatPageProps {
  character: Character;
  userId: string;
  isPro: boolean;
}

const MESSAGE_LIMITS = {
  guest: 3,
  free: 7,
  pro: Infinity,
};

export function ChatPage({ character, userId, isPro }: ChatPageProps) {
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTextStreaming, setIsTextStreaming] = useState(false);
  const [affection, setAffection] = useState(10);
  const [remainingMessages, setRemainingMessages] = useState(MESSAGE_LIMITS.free);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    loadMessages();
    loadRelation();
  }, [character.id, userId]);

  useEffect(() => {
    updateRemainingMessages();
  }, [messages, isPro]);

  const updateRemainingMessages = () => {
    const userMessages = messages.filter((m) => m.role === 'user' && !m.isLocal);
    const limit = isPro ? MESSAGE_LIMITS.pro : MESSAGE_LIMITS.free;
    const remaining = Math.max(0, limit - userMessages.length);
    setRemainingMessages(remaining);
  };

  const loadMessages = async () => {
    const res = await fetch(`/api/messages?characterId=${character.id}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.map((m: Message) => ({ ...m, isLocal: false })));
      
      await checkAndSendOpening(data);
    }
  };

  const checkAndSendOpening = async (currentMessages: Message[]) => {
    const res = await fetch('/api/opening/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, characterId: character.id, messageCount: currentMessages.length }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.shouldSend && data.message) {
        setMessages((prev) => [...prev, { ...data.message, isLocal: false }]);
      }
    }
  };

  const loadRelation = async () => {
    const res = await fetch(`/api/relation?userId=${userId}&characterId=${character.id}`);
    if (res.ok) {
      const data = await res.json();
      setAffection(data.affection || 10);
    }
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTextStreaming) return;

    if (!isPro && remainingMessages <= 0) {
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setIsTextStreaming(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMessageId = `local-${Date.now()}`;
    const assistantMessageId = `local-${Date.now() + 1}`;

    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        userId,
        characterId: character.id,
        role: 'user',
        content: userMessage,
        createdAt: new Date(),
        isLocal: true,
      } as ExtendedMessage,
    ]);

    setMessages((prev) => [
      ...prev,
      {
        id: assistantMessageId,
        userId,
        characterId: character.id,
        role: 'assistant',
        content: '',
        createdAt: new Date(),
        isLocal: true,
      } as ExtendedMessage,
    ]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: character.id, content: userMessage }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('No reader');
      }

      const decoder = new TextDecoder();
      let assistantMessage = '';
      let generatingImageId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'text' && parsed.text) {
              assistantMessage += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                const msgIndex = updated.findIndex((m) => m.id === assistantMessageId);
                if (msgIndex !== -1) {
                  updated[msgIndex] = {
                    ...updated[msgIndex],
                    content: assistantMessage,
                  };
                }
                return updated;
              });
            } else if (parsed.type === 'generating_image') {
              generatingImageId = `local-${Date.now()}-img`;
              setMessages((prev) => [
                ...prev,
                {
                  id: generatingImageId,
                  userId,
                  characterId: character.id,
                  role: 'assistant',
                  content: '',
                  isGeneratingImage: true,
                  createdAt: new Date(),
                  isLocal: true,
                } as ExtendedMessage,
              ]);
            } else if (parsed.type === 'image' && parsed.url) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.isGeneratingImage
                    ? {
                        ...msg,
                        isGeneratingImage: false,
                        imageUrl: parsed.url,
                      }
                    : msg
                )
              );
            } else if (parsed.type === 'image_failed') {
              setMessages((prev) => prev.filter((msg) => !msg.isGeneratingImage));
            } else if (parsed.type === 'done') {
              setIsTextStreaming(false);
            }
          } catch (err) {
            console.error('[Chat] Failed to parse SSE data:', data, err);
          }
        }
      }

      setTimeout(() => {
        loadMessages();
        loadRelation();
      }, 100);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[Chat] Request aborted');
      } else {
        console.error('[Chat] Error:', error);
      }
    } finally {
      setIsTextStreaming(false);
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

      <main className="flex-1 overflow-y-auto">
        {!isPro && (
          <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800">
            <ChatLimitWarning
              userId={userId}
              remainingMessages={remainingMessages}
              isLoggedIn={true}
            />
          </div>
        )}

        <div className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-20">
              <p>开始和 {character.name} 聊天吧~</p>
              {!isPro && remainingMessages <= 0 && (
                <p className="text-amber-400 text-sm mt-2">对话次数已用完，请升级 Pro</p>
              )}
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
                {message.content && (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
                {message.isGeneratingImage && (
                  <div className="flex items-center gap-2 mt-2">
                    <Camera className="w-4 h-4 text-zinc-400 animate-spin" />
                    <span className="text-sm text-zinc-400">{character.name}正在拍照...</span>
                  </div>
                )}
                {message.imageUrl && (
                  <img
                    src={message.imageUrl}
                    alt="character sent"
                    className="mt-2 rounded-lg max-w-[250px] w-full"
                  />
                )}
              </div>
            </div>
          ))}

          {isTextStreaming && (
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
        </div>
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
            disabled={isTextStreaming || (!isPro && remainingMessages <= 0)}
          />
          <Button
            type="submit"
            size="icon"
            className="bg-amber-400 text-zinc-900 hover:bg-amber-500 shrink-0"
            disabled={isTextStreaming || !input.trim() || (!isPro && remainingMessages <= 0)}
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
