'use client';

import { useState } from 'react';

interface DodoCheckoutButtonProps {
  userId?: string;
  productId?: string;
  children?: React.ReactNode;
}

export function DodoCheckoutButton({ 
  userId, 
  productId = process.env.NEXT_PUBLIC_DODO_PRODUCT_ID || 'pdt_0NfZpejqc2ODFhsO7NmNA',
  children 
}: DodoCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/dodo-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_cart: [
            {
              product_id: productId,
              quantity: 1,
            },
          ],
          customer: {},
          metadata: {
            userId,
          },
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}thank-you`,
        }),
      });

      const data = await response.json();

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setError(data.message || 'Failed to create checkout session');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <p className="text-red-400 text-sm mb-2">{error}</p>
      )}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Loading...' : (children || '升级为 Pro (Dodo)')}
      </button>
    </>
  );
}