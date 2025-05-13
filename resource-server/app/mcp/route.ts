import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { default as _debug } from "debug";

const debug = _debug("mcp-demo-resource-server");

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

export async function POST(req: Request) {
  debug("Request hit MCP endpoint route");

  // Check for an Authorization header
  if (!req.headers.get("Authorization")) {
    debug("No authorization header, sending back an error");

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
  }

  //
  // This is the implementation of the actual mcp server if we have passed auth
  //

  // Check for existing session ID
  const sessionId = req.headers.get("mcp-session-id");
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        transports[sessionId] = transport;
      },
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };

    const server = new McpServer({
      name: "Clerk MCP Demo Server",
      version: "0.0.1",
    });

    // this is where tools can be defined
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

    server.connect(transport);
  } else {
    // Invalid request
    return Response.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: No valid session ID provided",
        },
        id: null,
      },
      { status: 400 }
    );
  }

  // Handle the request
  // TODO: we have a very nasty type mismatch here since this was written to
  // work with express but nextjs uses a web standard Request object
  // await transport.handleRequest(req, res, req.body);
}
