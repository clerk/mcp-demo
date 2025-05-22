import { auth } from "@clerk/nextjs/server";
import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";

export async function POST(req: Request) {
  const origin = new URL(req.url).origin;

  // Authorize the request
  if (!req.headers.get("Authorization")) {
    return new Response(null, {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer resource_metadata=${origin}/.well-known/oauth-protected-resource`,
      },
    });
  } else {
    const { subject } = await auth({ acceptsToken: "oauth_token" });

    if (!subject) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Handle the MCP call
  return createMcpHandler((server) => {
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
  })(req);
}
