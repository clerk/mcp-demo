import { protectedResourceHandler } from "../../../../clerk-mcp-tools/nextjs";

const handler = protectedResourceHandler(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!
);

export { handler as GET };
