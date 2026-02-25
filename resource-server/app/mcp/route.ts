import {
  createMcpHandler,
  experimental_withMcpAuth as withMcpAuth,
} from "@vercel/mcp-adapter";
import { auth, clerkClient } from "@clerk/nextjs/server";

type AuthInfoFunc = Parameters<typeof withMcpAuth>[1];

// this AuthInfo type should be exported from the @vercel/mcp-adapter package, juggling for now
type AuthInfo = AuthInfoFunc extends (...args: any[]) => infer R
  ? R extends Promise<infer P>
    ? P
    : R
  : never;

function checkAuth(authInfo: AuthInfo) {
  const subject = authInfo?.extra?.subject as string | undefined;
  if (!subject) {
    console.error(authInfo);
    throw new Error("Unauthenticated");
  }
  return subject;
}

const clerk = await clerkClient();

const handler = createMcpHandler((server) => {
  server.tool(
    "get-clerk-user-data",
    "Gets data about the Clerk user that authorized this request",
    {},
    async (_, { authInfo }) => {
      const subject = checkAuth(authInfo);
      const user = await clerk.users.getUser(subject);
      return {
        content: [{ type: "text", text: JSON.stringify(user) }],
      };
    }
  );
});

const authHandler = withMcpAuth(
  handler,
  async (_, token) => {
    if (!token) return undefined;
    const machineAuth = await auth({ acceptsToken: "oauth_token" });
    if (!machineAuth.id) return undefined;
    return {
      token,
      clientId: machineAuth.id,
      scopes: machineAuth.scopes,
      extra: {
        subject: machineAuth.subject,
      },
    };
  },
  { required: true }
);

export { authHandler as GET, authHandler as POST };
