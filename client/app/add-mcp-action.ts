"use server";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import fsStore from "@/stores/fs";
import { default as _debug } from "debug";

const debug = _debug("mcp-demo-client");

export async function submitIntegration(formData: FormData) {
  const url = formData.get("url");
  let clientId = formData.get("client_id") || null;
  let clientSecret = formData.get("client_secret") || null;

  debug("Integration submitted:", { url, clientId, clientSecret });

  if (!url) return { error: "MCP server url not passed" };

  // The url passed in is expected to be an MCP server, so we attempt to
  // connect to it via the MCP protcol here
  let transport: StreamableHTTPClientTransport;
  let client: Client;
  try {
    transport = new StreamableHTTPClientTransport(new URL(url.toString()));
    client = new Client({
      name: "Clerk MCP Demo",
      version: "0.0.1",
    });
  } catch (err) {
    debug("MCP Client connection error", err);
    return { error: "Error connecting to MCP client" };
  }

  // We need to collect several URLs throughout the authorization server
  // discovery process, we will store them all here.
  interface Urls {
    oauthRedirectUrl: string;
    mcpEndpoint: string;
    protectedResourceMetadata?: string;
    authServerMetadata?: string;
    authServer?: string;
    authorizeEndpoint?: string;
    registerEndpoint?: string;
  }

  const urls: Urls = {
    oauthRedirectUrl: "http://localhost:3000/oauth_callback",
    mcpEndpoint: url.toString(),
  };

  // Make the initial un-authenticated request - we expect an error here
  try {
    const result = await client.connect(transport);
    console.log(result);
  } catch (err) {
    debug("Initial mcp client connection error:", err);
    if (!(err instanceof Error)) {
      return { error: "MCP client without auth didn't return an error" };
    }

    // Unfortunately we have to parse this since the mcp client class forces a
    // throw with a string.
    // https://github.com/modelcontextprotocol/typescript-sdk/blob/bced33d8bc57419c6d498ca9a26a284f3ccf6016/src/client/streamableHttp.ts#L414
    const match = err.message
      .toString()
      .match(/^Error POSTing to endpoint \(HTTP 401\): (.*)/);

    if (!match || !match[1]) {
      return { error: "Unexpected error format from MCP client" };
    }

    const jsonRes = JSON.parse(match[1]);
    urls.protectedResourceMetadata = jsonRes.error["www-authenticate"].match(
      /^Bearer resource_metadata=(.*)/
    )[1];

    debug("Protected resource metadata URL: ", urls.protectedResourceMetadata);
  }

  if (!urls.protectedResourceMetadata) {
    return {
      error:
        "Unable to get protected resource metdata url from MCP server response",
    };
  }

  // Hit the protected resource metadata url
  const protectedResourceRes = await fetch(urls.protectedResourceMetadata).then(
    (res) => res.json()
  );
  debug("Protected resource metadata response: ", protectedResourceRes);

  urls.authServer = protectedResourceRes.authorization_servers[0];
  urls.authServerMetadata = new URL(
    ".well-known/oauth-authorization-server",
    urls.authServer
  ).toString();

  if (!urls.authServer || !urls.authServerMetadata) {
    return {
      error:
        "Unable to get authorization server from protected resource metadata",
    };
  }

  // Hit the authorization server metadata url
  // I don't like that we need to make requests to two different oauth metadata
  // routes in order for this to work. Raised it as an issue with MCP spec here:
  // https://github.com/modelcontextprotocol/modelcontextprotocol/issues/502

  // We haven't shipped this metadata url YET for Clerk, so we mock it
  const authServerMetadataHasShipped = false;

  if (authServerMetadataHasShipped) {
    const authMetadataRes = await fetch(urls.authServerMetadata).then((res) =>
      res.json()
    );

    debug("Authorization server metadata response", authMetadataRes);
    urls.authorizeEndpoint = authMetadataRes.authorization_endpoint;
    urls.registerEndpoint = authMetadataRes.registration_endpoint;

    if (!urls.authorizeEndpoint) {
      return {
        error: "Auth server metadata did not return an authorize endpoint",
      };
    }
  } else {
    urls.authorizeEndpoint = new URL("oauth/authorize", urls.authServer).href;
    urls.registerEndpoint = new URL("oauth/register", urls.authServer).href;
  }

  // Run dynamic client registration if needed
  if (!clientId && !clientSecret) {
    if (!urls.registerEndpoint) {
      return {
        error:
          "Dynamic client registration required, but authorization server does not have a registration endpoint",
      };
    }

    const res = await fetch(urls.registerEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: "Test Client",
        client_uri: "https://localhost:3000",
        redirect_uris: [urls.oauthRedirectUrl],
        scope: "openid email profile",
      }),
    }).then((res) => res.json());

    debug("Dynamic client registration response: ", res);

    clientId = res.clientId;
    clientSecret = res.clientSecret;

    if (!clientId || !clientSecret) {
      return {
        error:
          "Dynamic client registration did not return a client id and/or secret",
      };
    }
  }

  // Write the oauth client details to a store, so that we
  // can pull and verify them in the OAuth callback.
  const state = randomUUID();
  fsStore.write(state, {
    clientId: clientId!.toString(),
    clientSecret: clientSecret!.toString(),
    callback: urls.oauthRedirectUrl,
    authServerUrl: urls.authServer || "",
    mcpEndpoint: urls.mcpEndpoint,
  });

  const params = {
    response_type: "code",
    client_id: clientId!.toString(),
    redirect_uri: urls.oauthRedirectUrl,
    scope: "openid email profile",
    state,
  };

  debug("Redirecting to OAuth authorize endpoint");
  redirect(
    `${urls.authorizeEndpoint}?${new URLSearchParams(params).toString()}`
  );

  // other things we can do with the MCP SDK, for the future:
  // transport.handleRequest(incomingRequest, res)
  // client.callTool()
}
