import type { NextAuthConfig } from "next-auth";

// Lightweight auth config for middleware (no Prisma, Edge-compatible)
export const authConfig: NextAuthConfig = {
  providers: [], // providers are added in the full auth.ts
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
