import { auth } from "@clerk/nextjs/server";
import { createMcpHandler } from "@vercel/mcp-adapter";
import { createMcpAuthHandler } from "@clerk/mcp-tools/next";
import { z } from "zod";

const handler = createMcpHandler(async (server) => {
  server.tool(
    "roll_dice",
    "Rolls an N-sided die",
    { sides: z.number().int().min(2) },
    async ({ sides }) => {
      const value = 1 + Math.floor(Math.random() * sides);
      return {
        content: [{ type: "text", text: `🎲 You rolled a ${value}!` }],
      };
    }
  );
});

const postHandler = createMcpAuthHandler(handler, async () => {
  const { subject } = await auth({ acceptsToken: "oauth_token" });
  return !!subject;
});

export { handler as GET, postHandler as POST };
