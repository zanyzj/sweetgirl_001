'use client';

import { useState } from 'react';
import { CreemCheckoutButton } from './creem-checkout-button';

interface ChatLimitWarningProps {
  userId?: string;
  remainingMessages: number;
  isLoggedIn: boolean;
}

export function ChatLimitWarning({ userId, remainingMessages, isLoggedIn }: ChatLimitWarningProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (remainingMessages > 0) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-amber-400 text-sm">
              {isLoggedIn 
                ? `剩余 ${remainingMessages} 轮对话` 
                : `游客模式：剩余 ${remainingMessages} 轮对话`
              }
            </span>
          </div>
          {!isLoggedIn && (
            <button
              onClick={() => setShowUpgrade(true)}
              className="text-amber-400 hover:text-amber-300 text-sm font-medium"
            >
              登录解锁更多
            </button>
          )}
          {isLoggedIn && remainingMessages <= 2 && (
            <button
              onClick={() => setShowUpgrade(true)}
              className="text-amber-400 hover:text-amber-300 text-sm font-medium"
            >
              升级 Pro
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-red-400 font-medium">对话次数已用完</p>
            {isLoggedIn ? (
              <p className="text-red-300/70 text-sm mt-1">升级到 Pro 版，享受无限次对话</p>
            ) : (
              <p className="text-red-300/70 text-sm mt-1">登录后可获得更多对话次数</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowUpgrade(true)}
          className="text-red-400 hover:text-red-300 text-sm font-medium flex-shrink-0"
        >
          {isLoggedIn ? '立即升级' : '立即登录'}
        </button>
      </div>

      {showUpgrade && (
        <div className="mt-4 pt-4 border-t border-red-500/30">
          {isLoggedIn ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="text-sm text-zinc-300">
                升级到 Pro 版，享受无限次对话
              </div>
              <CreemCheckoutButton userId={userId}>
                <span className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold rounded-lg transition-colors">
                  升级 Pro ($9.9/月)
                </span>
              </CreemCheckoutButton>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="text-sm text-zinc-300">
                登录后每次游戏可获得 7 轮对话
              </div>
              <a
                href="/login"
                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold rounded-lg transition-colors"
              >
                立即登录
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
