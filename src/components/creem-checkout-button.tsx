'use client';

import { CreemCheckout } from '@creem_io/nextjs';

interface CreemCheckoutButtonProps {
  userId?: string;
  productId?: string;
  children?: React.ReactNode;
}

export function CreemCheckoutButton({ 
  userId, 
  productId = process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID || 'prod_19wU0wR2tL6EMfVMlwrYQJ',
  children 
}: CreemCheckoutButtonProps) {
  return (
    <CreemCheckout
      productId={productId}
      successUrl="/thank-you"
      metadata={{
        userId,
        source: 'web',
      }}
    >
      {children || (
        <button className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-zinc-900 font-bold rounded-lg transition-colors">
          升级为 Pro
        </button>
      )}
    </CreemCheckout>
  );
}