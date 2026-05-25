'use client';

import { useState, useEffect } from 'react';
import { authClient } from '../../../lib/auth-client';
import { DodoCheckoutButton } from '@/components/dodo-checkout-button';

export default function TestDodoPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [staticLoading, setStaticLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await authClient.getSession();
      setSession(data);
      setLoading(false);
    };
    fetchSession();
  }, []);

  const handleStaticCheckout = async () => {
    setStaticLoading(true);
    setError(null);

    try {
      const productId = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID || 'pdt_0NfZpejqc2ODFhsO7NmNA';
      const userId = session?.user?.id;
      
      let url = `/dodo-checkout?productId=${productId}`;
      if (userId) {
        url += `&metadata_userId=${userId}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError(data.message || 'Failed to get checkout URL');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setStaticLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">DodoPayments 支付测试</h1>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">当前登录状态</h2>
          {session?.user ? (
            <div className="space-y-2">
              <p><span className="text-gray-400">用户ID:</span> {session.user.id}</p>
              <p><span className="text-gray-400">邮箱:</span> {session.user.email}</p>
              <p><span className="text-gray-400">姓名:</span> {session.user.name || '未设置'}</p>
            </div>
          ) : (
            <p className="text-yellow-400">未登录 - 请先登录后再测试支付</p>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">测试支付按钮</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">静态支付链接 (GET)</p>
              <button
                onClick={handleStaticCheckout}
                disabled={staticLoading}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {staticLoading ? '加载中...' : '静态支付链接测试'}
              </button>
            </div>
            
            <div>
              <p className="text-sm text-gray-400 mb-2">Checkout Session (POST)</p>
              <DodoCheckoutButton 
                userId={session?.user?.id}
                productId={process.env.NEXT_PUBLIC_DODO_PRODUCT_ID || 'pdt_0NfZpejqc2ODFhsO7NmNA'}
              >
                Checkout Session 测试
              </DodoCheckoutButton>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">配置信息</h2>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-400">产品ID:</span> {process.env.NEXT_PUBLIC_DODO_PRODUCT_ID || 'pdt_0NfZpejqc2ODFhsO7NmNA'}</p>
            <p><span className="text-gray-400">环境:</span> 测试模式 (test_mode)</p>
            <p><span className="text-gray-400">返回URL:</span> http://localhost:3000/thank-you</p>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>测试说明：</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>静态支付链接：直接跳转到 Dodo 支付页面</li>
            <li>Checkout Session：创建会话后跳转，支持更多自定义选项</li>
            <li>支付成功后，Webhook 会自动更新用户的 Pro 状态</li>
            <li>测试模式下可以使用测试信用卡进行支付</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
