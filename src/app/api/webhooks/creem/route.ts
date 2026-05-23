import { Webhook } from '@creem_io/nextjs';
import { db } from '@/db';
import { userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const POST = Webhook({
  webhookSecret: process.env.CREEM_API_SECRET!,

  onCheckoutCompleted: async ({ customer, product, metadata }) => {      
    if (customer && product) {
      console.log(`Checkout completed: ${customer.email} purchased ${product.name}`);
    }
    
    if (metadata?.userId) {
      const userId = String(metadata.userId);
      await db.update(userProfiles)
        .set({ isPro: true })
        .where(eq(userProfiles.userId, userId));
    }
  },

  onGrantAccess: async ({ customer, metadata }) => {
    if (customer) {
      console.log(`Access granted for: ${customer.email}`);
    }
    
    if (metadata?.userId) {
      const userId = String(metadata.userId);
      await db.update(userProfiles)
        .set({ isPro: true })
        .where(eq(userProfiles.userId, userId));
    }
  },

  onRevokeAccess: async ({ customer, metadata }) => {
    if (customer) {
      console.log(`Access revoked for: ${customer.email}`);
    }
    
    if (metadata?.userId) {
      const userId = String(metadata.userId);
      await db.update(userProfiles)
        .set({ isPro: false })
        .where(eq(userProfiles.userId, userId));
    }
  },
});