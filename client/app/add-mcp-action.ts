"use server";

import {
  createDynamicallyRegisteredMcpClient,
  createKnownCredentialsMcpClient,
  type McpClientReturnType,
} from "@clerk/mcp-tools/client";
import { redirect as _redirect } from "next/navigation";
import fsStore from "@clerk/mcp-tools/stores/fs";
import { cookies } from "next/headers";

export async function submitIntegration(formData: FormData) {
  // grab the data from the form submission
  const mcpEndpoint = formData.get("url")?.toString();
  const clientId = formData.get("client_id")?.toString() || undefined;
  const clientSecret = formData.get("client_secret")?.toString() || undefined;

  if (!mcpEndpoint) return { error: "MCP server url not passed" };

  // shared configuration for both client types
  const sharedConfig = {
    mcpEndpoint,
    oauthRedirectUrl: "http://localhost:3000/oauth_callback",
    oauthScopes: "openid profile email",
    mcpClientName: "Clerk MCP Demo",
    mcpClientVersion: "0.0.1",
    redirect: (url: string) => _redirect(url),
    store: fsStore,
  };

  let clientRes: McpClientReturnType;

  if (clientId && clientSecret) {
    // if a client id and secret are provided, use an existing oauth client
    const params = {
      ...sharedConfig,
      clientId,
      clientSecret,
    };
    clientRes = await createKnownCredentialsMcpClient(params);
  } else {
    // if not, dynamically register a new oauth client
    const params = {
      ...sharedConfig,
      oauthClientUri: "http://example.com",
      oauthPublicClient: false,
    };
    clientRes = await createDynamicallyRegisteredMcpClient(params);
  }

  const { connect, sessionId } = clientRes;

  // set the session id in a cookie so we can retrieve the client details from
  // the store in other routes
  const cookieStore = await cookies();
  cookieStore.set("mcp-session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  // connect to the mcp server - this will redirect to oauth so we don't need
  // to return anything
  await connect();
}
