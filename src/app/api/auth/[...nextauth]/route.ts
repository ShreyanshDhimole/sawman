import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("Missing email or password");
          throw new Error("Invalid credentials");
        }

        try {
          await dbConnect();
          console.log("Database connected for auth");
        } catch (dbError) {
          console.error("Database connection failed:", dbError);
          throw new Error("Database connection failed");
        }

        try {
          const user = await User.findOne({ email: credentials.email });
          
          if (!user) {
            // Bootstrap: if a user logs in as admin@example.com and no user exists, create one
            if (credentials.email === "admin@example.com") {
              console.log("Creating bootstrap admin user");
              const hashedPassword = await bcrypt.hash(credentials.password, 10);
              const newAdmin = await User.create({
                name: "Super Admin",
                email: "admin@example.com",
                password: hashedPassword,
                role: "admin",
              });
              return { 
                id: newAdmin._id.toString(), 
                email: newAdmin.email, 
                name: newAdmin.name, 
                role: newAdmin.role 
              };
            }
            console.warn(`User not found: ${credentials.email}`);
            return null;
          }

          // Validate password exists in database
          if (!user.password) {
            console.error(`User ${credentials.email} has no password set`);
            return null;
          }

          const passwordsMatch = await bcrypt.compare(credentials.password, user.password);
          if (!passwordsMatch) {
            console.warn(`Invalid password attempt for ${credentials.email}`);
            return null;
          }

          console.log(`User authenticated: ${credentials.email}`);
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("Authorization error:", error instanceof Error ? error.message : String(error));
          throw new Error("Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
