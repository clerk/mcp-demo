"use server";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { default as _debug } from "debug";
import { createTransport } from "@/lib/create-transport";

const debug = _debug("mcp-demo-client");

export async function submitIntegration(formData: FormData) {
  const mcpEndpoint = formData.get("url")?.toString();
  const clientId = formData.get("client_id")?.toString() || undefined;
  const clientSecret = formData.get("client_secret")?.toString() || undefined;

  debug("Integration submitted:", { mcpEndpoint, clientId, clientSecret });

  if (!mcpEndpoint) return { error: "MCP server url not passed" };

  const transport = createTransport({
    clientId,
    clientSecret,
    mcpEndpoint,
    oauthCallbackUrl: "http://localhost:3000/oauth_callback",
  });

  const client = new Client({
    name: "Clerk MCP Demo",
    version: "0.0.1",
  });

  await client.connect(transport);

  return { success: "MCP Client connected" };
}
