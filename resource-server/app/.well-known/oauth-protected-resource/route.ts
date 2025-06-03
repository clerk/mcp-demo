import { protectedResourceHandlerClerk } from "@clerk/mcp-tools/next";

const handler = protectedResourceHandlerClerk(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!
);

export { handler as GET };
