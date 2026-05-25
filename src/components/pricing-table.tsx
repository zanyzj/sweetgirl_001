'use client';

import { useState } from 'react';
import { CreemCheckoutButton } from './creem-checkout-button';

interface PricingTableProps {
  userId?: string;
  isPro?: boolean;
}

export function PricingTable({ userId, isPro }: PricingTableProps) {
  const [yearly, setYearly] = useState(false);

  const plans = [
    {
      name: '免费版',
      price: '免费',
      yearlyPrice: null,
      description: '适合初次体验',
      features: [
        { text: '每次游戏最多 7 轮对话', included: true },
        { text: '基础角色互动', included: true },
        { text: '每日登录奖励', included: true },
        { text: '无限次提问', included: false },
        { text: '专属角色内容', included: false },
        { text: '优先技术支持', included: false },
      ],
      cta: '开始体验',
      popular: false,
      disabled: isPro,
    },
    {
      name: 'Pro 版',
      price: '$9.9',
      yearlyPrice: '$99',
      description: '无限畅玩',
      features: [
        { text: '每次游戏最多 7 轮对话', included: true },
        { text: '基础角色互动', included: true },
        { text: '每日登录奖励', included: true },
        { text: '无限次提问', included: true },
        { text: '专属角色内容', included: true },
        { text: '优先技术支持', included: true },
      ],
      cta: isPro ? '已订阅' : '立即升级',
      popular: true,
      disabled: isPro,
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900">
      <div className="max-w-6xl mx-auto px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-amber-400 mb-4">选择你的订阅方案</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            解锁更多功能，与你的虚拟女友建立更深的连接
          </p>
          
          {/* 切换按钮 */}
          <div className="inline-flex items-center mt-6 bg-zinc-700 rounded-full p-1">
            <button
              onClick={() => setYearly(false)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !yearly ? 'bg-amber-500 text-zinc-900' : 'text-zinc-400 hover:text-white'
              }`}
            >
              月付
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                yearly ? 'bg-amber-500 text-zinc-900' : 'text-zinc-400 hover:text-white'
              }`}
            >
              年付 <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">省17%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? 'bg-gradient-to-b from-amber-500/20 to-zinc-800 border-2 border-amber-500'
                  : 'bg-zinc-800 border border-zinc-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-zinc-900 text-sm font-bold px-4 py-1 rounded-full">
                  最受欢迎
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-zinc-400 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-white">
                    {yearly && plan.yearlyPrice ? plan.yearlyPrice : plan.price}
                  </span>
                  <span className="text-zinc-400">
                    /{yearly ? '年' : '月'}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        feature.included ? 'bg-green-500' : 'bg-zinc-700'
                      }`}
                    >
                      {feature.included ? (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <span className={feature.included ? 'text-white' : 'text-zinc-500'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="text-center">
                {plan.name === 'Pro 版' ? (
                  <CreemCheckoutButton userId={userId}>
                    <span className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed block">
                      {plan.cta}
                    </span>
                  </CreemCheckoutButton>
                ) : (
                  <button
                    disabled={plan.disabled}
                    className="px-8 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-zinc-500 text-sm mt-8">
          所有订阅均支持随时取消。支付由 Creem 安全处理。
        </p>
      </div>
    </section>
  );
}
