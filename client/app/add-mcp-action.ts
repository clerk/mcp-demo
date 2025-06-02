"use server";

import {
  createDynamicallyRegisteredMcpClient,
  createKnownCredentialsMcpClient,
  type McpClientReturnType,
} from "../../clerk-mcp-tools/mcp-client";
import { redirect as _redirect } from "next/navigation";
import fsStore from "../../clerk-mcp-tools/stores/fs";
import { cookies } from "next/headers";

export async function submitIntegration(formData: FormData) {
  // grab the data from the form submission
  const mcpEndpoint = formData.get("url")?.toString();
  const clientId = formData.get("client_id")?.toString() || undefined;
  const clientSecret = formData.get("client_secret")?.toString() || undefined;

  if (!mcpEndpoint) return { error: "MCP server url not passed" };

  // set some defaults for the oauth/mcp client
  const oauthScopes = "openid profile email";
  const oauthRedirectUrl = "http://localhost:3000/oauth_callback";
  const oauthClientUri = "http://example.com";
  const oauthPublicClient = false; // not needed since we have a server here
  const mcpClientName = "Clerk MCP Demo";
  const mcpClientVersion = "0.0.1";
  const redirect = (url: string) => _redirect(url);
  const store = fsStore;

  let clientRes: McpClientReturnType;

  if (clientId && clientSecret) {
    // if a client id and secret are provided, use an existing oauth client
    clientRes = createKnownCredentialsMcpClient({
      clientId,
      clientSecret,
      oauthRedirectUrl,
      oauthScopes,
      mcpEndpoint,
      mcpClientName,
      mcpClientVersion,
      redirect,
      store,
    });
  } else {
    // if not, dynamically register a new oauth client
    clientRes = createDynamicallyRegisteredMcpClient({
      mcpEndpoint,
      oauthScopes,
      oauthRedirectUrl,
      oauthClientUri,
      oauthPublicClient,
      mcpClientName,
      mcpClientVersion,
      redirect,
      store,
    });
  }

  const { connect, sessionId } = clientRes;

  // set the session id in a cookie
  // TODO: what happens if the auth fails, like user rejects the oauth?
  // - we set the cookie somewhat prematurely here, but we need to because this is the only place we have the session id
  // - we can't set another cookie thats like "actually valid" because thats spoofable
  // - we could set some sort of internal property on the client object that they completed auth i guess
  const cookieStore = await cookies();
  cookieStore.set("mcp-session", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  });

  // connect to the mcp server
  await connect();

  // does this get returned at all?
  return { success: true };
}
