import { Webhooks } from "@dodopayments/nextjs";
import { db } from "@/db";
import { userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY!,
  
  onPayload: async (payload) => {
    console.log("Received Dodo webhook payload:", payload);
  },

  onPaymentSucceeded: async (payload) => {
    console.log("Payment succeeded:", payload);
    
    const userId = payload.data?.metadata?.userId;
    if (userId) {
      const userIdStr = String(userId);
      await db.update(userProfiles)
        .set({ isPro: true })
        .where(eq(userProfiles.userId, userIdStr));
    }
  },

  onPaymentFailed: async (payload) => {
    console.log("Payment failed:", payload);
  },

  onSubscriptionActive: async (payload) => {
    console.log("Subscription active:", payload);
    
    const userId = payload.data?.metadata?.userId;
    if (userId) {
      const userIdStr = String(userId);
      await db.update(userProfiles)
        .set({ isPro: true })
        .where(eq(userProfiles.userId, userIdStr));
    }
  },

  onSubscriptionCancelled: async (payload) => {
    console.log("Subscription cancelled:", payload);
    
    const userId = payload.data?.metadata?.userId;
    if (userId) {
      const userIdStr = String(userId);
      await db.update(userProfiles)
        .set({ isPro: false })
        .where(eq(userProfiles.userId, userIdStr));
    }
  },

  onSubscriptionExpired: async (payload) => {
    console.log("Subscription expired:", payload);
    
    const userId = payload.data?.metadata?.userId;
    if (userId) {
      const userIdStr = String(userId);
      await db.update(userProfiles)
        .set({ isPro: false })
        .where(eq(userProfiles.userId, userIdStr));
    }
  },
});