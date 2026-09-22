import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [Credentials({
    credentials: { email: {}, password: {} },
    async authorize(credentials) {
      const email = String(credentials.email ?? "").trim().toLowerCase();
      const password = String(credentials.password ?? "");
      const user = await db.user.findUnique({ where: { email } });
      if (!user || !await verifyPassword(password, user.passwordHash)) return null;
      return { id: user.id, email: user.email };
    },
  })],
  callbacks: {
    jwt({ token, user }) { if (user?.id) token.userId = user.id; return token; },
    session({ session, token }) { session.user.id = String(token.userId); return session; },
  },
});
