import { auth } from "@clerk/nextjs/server";
import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";
import { default as _debug } from "debug";

const debug = _debug("mcp-demo-resource-server");

export async function POST(req: Request) {
  if (!req.headers.get("Authorization")) {
    // This is hard coded here, but we plan to make it such that if this
    // request is forwarded to the actual resource endpoint without auth, we
    // will return the value below automatically via Clerk's SDKs.
    const wwwAuthenticateValue =
      "Bearer resource_metadata=http://localhost:3001/.well-known/oauth-protected-resource";

    return Response.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Unauthorized: Authentication required",
          // I'm taking this liberty since the official mcp client doesn't
          // return headers when it gets an error response at the moment.
          // https://github.com/modelcontextprotocol/typescript-sdk/blob/bced33d8bc57419c6d498ca9a26a284f3ccf6016/src/client/streamableHttp.ts#L414
          "www-authenticate": wwwAuthenticateValue,
        },
        id: null,
      },
      {
        status: 401,
        headers: {
          "WWW-Authenticate": wwwAuthenticateValue,
        },
      }
    );
  } else {
    debug("Verifying OAuth access token");

    const { subject } = await auth({ acceptsToken: "oauth_token" });

    if (!subject) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

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
