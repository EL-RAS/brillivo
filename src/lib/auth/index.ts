import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { account, session, user, verification } from "@/lib/db/schema";

const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
	socialProviders: {},
  session: {
    expiresIn: SEVEN_DAYS_IN_SECONDS,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: SEVEN_DAYS_IN_SECONDS,
    },
  },
  cookies: {
    sessionToken: {
      name: "auth_session",
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: SEVEN_DAYS_IN_SECONDS,
      },
    },
  },
  advanced: {
    database: {
      generateId: () => uuidv4(),
    },
  },
  plugins: [nextCookies()],
});

export type Auth = typeof auth;
