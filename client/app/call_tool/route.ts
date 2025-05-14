import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import { default as _debug } from "debug";
import fsStore from "@/stores/fs";

const debug = _debug("mcp-demo-client-tool-call");

export async function POST(request: Request) {
  const res = await request.json();
  debug("client id: ", res);
  const clientInfo = fsStore.read(res.clientId);

  debug("client info: ", clientInfo);

  // Implement auth provider
  const authProvider: OAuthClientProvider = {
    redirectUrl: clientInfo.oauthRedirectUrl,
    clientMetadata: { redirect_uris: [clientInfo.callbackUrl] },
    clientInformation: () => ({
      client_id: clientInfo.clientId,
      client_secret: clientInfo.clientSecret,
    }),
    saveClientInformation: () => undefined,
    tokens: () => ({
      access_token: clientInfo.oat,
      token_type: "Bearer",
    }),
    saveTokens: () => undefined,
    redirectToAuthorization: (url) => undefined, // returns a promise or void
    saveCodeVerifier: () => undefined,
    codeVerifier: () => "x",
  };

  let transport: StreamableHTTPClientTransport;
  let client: Client;
  try {
    transport = new StreamableHTTPClientTransport(
      new URL(clientInfo.mcpEndpoint),
      { authProvider }
    );
    client = new Client({
      name: "Clerk MCP Demo",
      version: "0.0.1",
    });
  } catch (err) {
    console.log("MCP Client connection error", err);
    return { error: "Error connecting to MCP client" };
  }

  await client.connect(transport);

  const toolRes = await client.callTool({
    name: "roll_dice",
    arguments: { sides: 6 },
  });

  debug("tool response", toolRes);

  return Response.json(toolRes);
}
