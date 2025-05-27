"use server";

import {
  createDynamicallyRegisteredMcpClient,
  createKnownCredentialsMcpClient,
} from "../../clerk-mcp-tools/mcp-client";
import { redirect as _redirect } from "next/navigation";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import fsStore from "../../clerk-mcp-tools/stores/fs";

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

  let clientRes: {
    transport: Transport;
    authProvider: OAuthClientProvider;
    client: Client;
  };

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

  const { transport, authProvider, client } = clientRes;

  // connect to the mcp server
  await client.connect(transport);

  // we put the client id in the url as a way to update the frontend
  // so we can get this from the auth provider
  const clientInfo = await authProvider.clientInformation();
  if (!clientInfo?.client_id) {
    throw new Error("Client ID not found on auth provider");
  }

  // add the client id to the url
  redirect(`/?client_id=${clientInfo.client_id}`);
}
