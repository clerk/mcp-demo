"use server";

import { createMcpClient } from "@/lib/mcp-client";
import { redirect } from "next/navigation";

export async function submitIntegration(formData: FormData) {
  const mcpEndpoint = formData.get("url")?.toString();
  const clientId = formData.get("client_id")?.toString() || undefined;
  const clientSecret = formData.get("client_secret")?.toString() || undefined;

  if (!mcpEndpoint) return { error: "MCP server url not passed" };

  const { transport, authProvider, client } = createMcpClient({
    clientId,
    clientSecret,
    mcpEndpoint,
    oauthCallbackUrl: "http://localhost:3000/oauth_callback",
  });

  await client.connect(transport);

  const clientInfo = await authProvider.clientInformation();

  if (!clientInfo?.client_id) {
    throw new Error("Client ID not found on auth provider");
  }

  redirect(`/?client_id=${clientInfo.client_id}`);
}
