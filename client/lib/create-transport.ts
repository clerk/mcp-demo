import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { redirect } from "next/navigation";
import fsStore from "@/stores/fs";
import { default as _debug } from "debug";
import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import { randomUUID } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const debug = _debug("mcp-demo-client");

type ClientInfo = {
  client_id?: string;
  client_secret?: string;
  mcpEndpoint?: string;
  oauthCallbackUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  redirectUris?: string[];
};

type TransportParams = {
  clientId?: string;
  clientSecret?: string;
  oauthCallbackUrl?: string;
  mcpEndpoint?: string;
};

const CODE_VERIFIER_PREFIX = "pkce_verifier_";

/**
 * Returns a streamable HTTP transport that can be used to connect to an MCP server.
 *
 * Handles 3 scenarios:
 * 1. New client requiring dynamic registration: Provide mcpEndpoint and oauthCallbackUrl
 * 2. Known client without registration: Provide clientId, clientSecret, mcpEndpoint, and oauthCallbackUrl
 * 3. Existing client (OAuth callback/tool call): Provide only clientId (other details loaded from store)
 */
export function createTransport(params: TransportParams) {
  const { clientId, clientSecret, oauthCallbackUrl, mcpEndpoint } = params;
  const state = randomUUID();

  // Handle different initialization scenarios
  if (!clientId) {
    // Scenario 1: Dynamic client registration (no clientId)
    debug("Creating transport with dynamic registration");
    return createNewTransportWithDynamicRegistration(
      state,
      mcpEndpoint,
      oauthCallbackUrl
    );
  } else if (clientId && clientSecret && mcpEndpoint && oauthCallbackUrl) {
    debug("Creating transport with known credentials");
    // Scenario 2: Known client without registration
    return createTransportWithKnownCredentials(
      state,
      clientId,
      clientSecret,
      mcpEndpoint,
      oauthCallbackUrl
    );
  } else {
    // Scenario 3: Existing client (OAuth callback or tool call)
    debug("Creating transport for existing client");
    return createTransportForExistingClient(state, clientId);
  }
}

/**
 * Creates a transport for a new client that requires dynamic registration
 */
function createNewTransportWithDynamicRegistration(
  state: string,
  mcpEndpoint?: string,
  oauthCallbackUrl?: string
) {
  debug("Dynamic registration", state, mcpEndpoint, oauthCallbackUrl);

  if (!mcpEndpoint) {
    throw new Error("MCP endpoint is required");
  }

  if (!oauthCallbackUrl) {
    throw new Error("OAuth callback URL is required");
  }

  const client: ClientInfo = {
    mcpEndpoint,
    oauthCallbackUrl,
  };

  return buildTransport(state, client);
}

/**
 * Creates a transport with known client credentials without needing registration
 */
function createTransportWithKnownCredentials(
  state: string,
  clientId: string,
  clientSecret: string,
  mcpEndpoint: string,
  oauthCallbackUrl: string
) {
  debug(
    "Known credentials",
    state,
    clientId,
    clientSecret,
    mcpEndpoint,
    oauthCallbackUrl
  );

  const client = fsStore.read(clientId) || {};

  client.client_id = clientId;
  client.client_secret = clientSecret;
  client.mcpEndpoint = mcpEndpoint;
  client.oauthCallbackUrl = oauthCallbackUrl;

  fsStore.write(clientId, client);
  fsStore.write(state, clientId);

  return buildTransport(state, client);
}

/**
 * Creates a transport for an existing client (OAuth callback or tool call)
 */
function createTransportForExistingClient(state: string, clientId: string) {
  debug("Existing client", state, clientId);

  const client = fsStore.read(clientId);

  if (!client) {
    throw new Error(`Client with ID ${clientId} not found in store`);
  }

  return buildTransport(state, client);
}

/**
 * Builds the transport with the configured client information
 */
function buildTransport(state: string, client: ClientInfo) {
  const authProvider: OAuthClientProvider = {
    redirectUrl: client.oauthCallbackUrl!,
    clientMetadata: { redirect_uris: client.redirectUris || [] },
    state: () => state,
    clientInformation: () => {
      if (!client.client_id) {
        return undefined;
      }
      // TODO: this should return the full client object
      return {
        client_id: client.client_id,
        client_secret: client.client_secret,
      };
    },
    saveClientInformation: (newInfo: OAuthClientInformationFull) => {
      const completedClientRegistration =
        !client.client_id && newInfo.client_id;

      if (completedClientRegistration) {
        // Associate state with new client ID and save client information
        fsStore.write(state, newInfo.client_id);
        fsStore.write(newInfo.client_id, { ...client, ...newInfo });
      } else {
        // Update existing client information
        fsStore.write(client.client_id!, { ...client, ...newInfo });
      }
    },
    tokens: () => {
      if (!client.accessToken) return undefined;
      return { access_token: client.accessToken, token_type: "Bearer" };
    },
    saveTokens: ({ access_token, refresh_token }) => {
      fsStore.write(client.client_id!, {
        ...client,
        accessToken: access_token,
        refreshToken: refresh_token,
      });
    },
    redirectToAuthorization: (url) => {
      redirect(url.toString());
    },
    saveCodeVerifier: (verifier: string) => {
      const verifierKey = `${CODE_VERIFIER_PREFIX}${client.client_id}`;
      debug(`Saving code verifier for client ${client.client_id}`);
      fsStore.write(verifierKey, verifier);
    },
    codeVerifier: () => {
      const verifierKey = `${CODE_VERIFIER_PREFIX}${client.client_id}`;
      const storedVerifier = fsStore.read(verifierKey);

      if (storedVerifier) {
        debug(
          `Retrieved stored code verifier for client ${client.client_id}: ${storedVerifier}`
        );
        return storedVerifier;
      }

      debug(`No code verifier found for client ${client.client_id}`);

      // The SDK will generate a new verifier if we return undefined
      return undefined;
    },
  };

  debug("Creating transport with MCP endpoint:", client.mcpEndpoint);
  const transport = new StreamableHTTPClientTransport(
    new URL(client.mcpEndpoint!),
    { authProvider }
  );

  debug("Creating MCP client");
  const mcpClient = new Client({
    name: "Clerk MCP Demo",
    version: "0.0.1",
  });

  return { transport, client: mcpClient, authProvider };
}
