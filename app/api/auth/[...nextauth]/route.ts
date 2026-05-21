import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { connectDB } from "@/lib/db";
import User from "@/models/User";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,

      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      await connectDB();

      await User.findOneAndUpdate(
        {
          email: user.email,
        },

        {
          name: user.name,
          email: user.email,
          image: user.image,

          accessToken: account?.access_token,
          refreshToken: account?.refresh_token,
        },

        {
          upsert: true,
          new: true,
        }
      );

      return true;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };