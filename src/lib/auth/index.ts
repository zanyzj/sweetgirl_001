import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { ProxyAgent, setGlobalDispatcher } from "undici";
import { db } from "@/db";

const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (process.env.NODE_ENV !== "production" && proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(proxyUrl));
}

export const auth = betterAuth({
  database: drizzleAdapter(db as any, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
});
