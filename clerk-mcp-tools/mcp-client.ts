import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";
import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import { randomUUID } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

// TODO: consider adding prefix to state and client as well
const CODE_VERIFIER_PREFIX = "pkce_verifier_";

export interface ClientStore {
  write: (key: string, value: any) => void;
  read: (key: string) => any;
}

interface KnownCredentialsMcpClientParams {
  clientId: string;
  clientSecret: string;
  oauthRedirectUrl: string;
  oauthScopes?: string;
  mcpEndpoint: string;
  mcpClientName: string;
  mcpClientVersion: string;
  redirect: (url: string) => void;
  store: ClientStore;
}

/**
 * This function is used to complete the OAuth flow. It is used in the OAuth
 * callback route to complete the OAuth flow given a state and auth code.
 */
export async function completeAuthWithCode({
  state,
  code,
  store,
}: {
  code: string;
  state: string;
  store: ClientStore;
}) {
  const clientId = store.read(state);

  if (!clientId) {
    throw new Error(`Client with ID ${clientId} not found in store`);
  }

  const { transport } = getClientById({ clientId, store });

  await transport.finishAuth(code);

  return { transport, clientId };
}

/**
 * Given a client ID and a store, retrieves the client details and returns a
 * transport and MCP client configured with an auth provider.
 */
export function getClientById({
  clientId,
  store,
  redirect,
}: {
  clientId: string;
  store: ClientStore;
  redirect?: (url: string) => void;
}) {
  const client = store.read(clientId);

  if (!client) {
    throw new Error(`Client with ID ${clientId} not found in store`);
  }

  // should abstract anything that is repeated here probably
  const authProvider: OAuthClientProvider = {
    redirectUrl: client.redirectUrl,
    clientMetadata: {
      redirect_uris: [client.redirectUrl],
    },
    clientInformation: () => {
      return {
        client_id: client.clientId,
        client_secret: client.clientSecret,
      };
    },
    saveClientInformation: (newInfo: OAuthClientInformationFull) => {
      store.write(client.clientId, { ...client, ...newInfo });
    },
    tokens: () => {
      if (!client.accessToken) return undefined;
      return { access_token: client.accessToken, token_type: "Bearer" };
    },
    saveTokens: ({ access_token, refresh_token }) => {
      store.write(client.clientId, {
        ...client,
        accessToken: access_token,
        refreshToken: refresh_token,
      });
    },
    redirectToAuthorization: (url) => {
      if (!redirect) {
        throw new Error("A redirect function was not provided.");
      }

      redirect(url.toString());
    },
    saveCodeVerifier: (verifier: string) => {
      store.write(`${CODE_VERIFIER_PREFIX}${client.clientId}`, verifier);
    },
    codeVerifier: () => {
      const storedVerifier = store.read(
        `${CODE_VERIFIER_PREFIX}${client.clientId}`
      );

      if (storedVerifier) {
        return storedVerifier;
      }

      // The SDK will generate a new verifier if we return undefined
      return undefined;
    },
  };

  const transport = new StreamableHTTPClientTransport(
    new URL(client.mcpEndpoint),
    { authProvider }
  );

  const mcpClient = new Client({
    name: client.mcpClientName,
    version: client.mcpClientVersion,
  });

  return { transport, client: mcpClient, authProvider };
}

/**
 * Creates a new MCP client and transport for the first time with a known
 * client id and secret.
 */
export function createKnownCredentialsMcpClient({
  clientId,
  clientSecret,
  oauthRedirectUrl,
  oauthScopes,
  mcpEndpoint,
  mcpClientName,
  mcpClientVersion,
  redirect,
  store,
}: KnownCredentialsMcpClientParams) {
  interface KnownCredentialsClient {
    clientId: string;
    clientSecret: string;
    mcpEndpoint: string;
    redirectUrl: string;
    oauthScopes?: string;
    accessToken?: string;
    refreshToken?: string;
    mcpClientName: string;
    mcpClientVersion: string;
  }

  const client: KnownCredentialsClient = {
    clientId,
    clientSecret,
    mcpEndpoint,
    redirectUrl: oauthRedirectUrl,
    mcpClientName,
    mcpClientVersion,
  };

  const state = randomUUID();

  store.write(client.clientId, {
    clientId,
    clientSecret,
    mcpEndpoint,
    redirectUrl: oauthRedirectUrl,
    mcpClientName,
    mcpClientVersion,
  });
  store.write(state, client.clientId);

  const authProvider: OAuthClientProvider = {
    redirectUrl: client.redirectUrl,
    // this is primarily used for dynamic client registration, so we only need
    // the minimal data here for it to work. maybe cuttable?
    clientMetadata: {
      redirect_uris: [client.redirectUrl],
      scope: oauthScopes,
    },
    state: () => state,
    clientInformation: () => {
      return {
        client_id: client.clientId,
        client_secret: client.clientSecret,
      };
    },
    // i think this is only used for dynamic client registration, we may be
    // able to leave it out entirely
    saveClientInformation: (newInfo: OAuthClientInformationFull) => {
      console.log("!!! saving client info", newInfo);
      store.write(client.clientId, { ...client, ...newInfo });
    },
    tokens: () => {
      if (!client.accessToken) return undefined;
      return { access_token: client.accessToken, token_type: "Bearer" };
    },
    saveTokens: ({ access_token, refresh_token }) => {
      store.write(client.clientId, {
        ...client,
        accessToken: access_token,
        refreshToken: refresh_token,
      });
    },
    redirectToAuthorization: (url) => {
      redirect(url.toString());
    },
    saveCodeVerifier: (verifier: string) => {
      store.write(`${CODE_VERIFIER_PREFIX}${client.clientId}`, verifier);
    },
    codeVerifier: () => {
      const storedVerifier = store.read(
        `${CODE_VERIFIER_PREFIX}${client.clientId}`
      );

      if (storedVerifier) {
        return storedVerifier;
      }

      // The SDK will generate a new verifier if we return undefined
      return undefined;
    },
  };

  const transport = new StreamableHTTPClientTransport(
    new URL(client.mcpEndpoint),
    { authProvider }
  );

  const mcpClient = new Client({
    name: mcpClientName,
    version: mcpClientVersion,
  });

  return { transport, client: mcpClient, authProvider };
}

export function createDynamicallyRegisteredMcpClient({
  mcpEndpoint,
  oauthRedirectUrl,
  oauthClientName,
  oauthClientUri,
  oauthScopes,
  oauthPublicClient,
  mcpClientName,
  mcpClientVersion,
  redirect,
  store,
}: {
  mcpEndpoint: string;
  oauthRedirectUrl: string;
  oauthClientName?: string;
  oauthClientUri?: string;
  oauthScopes?: string;
  oauthPublicClient?: boolean;
  mcpClientName: string;
  mcpClientVersion: string;
  redirect: (url: string) => void;
  store: ClientStore;
}) {
  const state = randomUUID();

  interface DynamicallyRegisteredClient {
    mcpEndpoint: string;
    redirectUrl: string;
    clientId?: string;
    clientSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    mcpClientName: string;
    mcpClientVersion: string;
  }

  let client: DynamicallyRegisteredClient = {
    mcpEndpoint,
    redirectUrl: oauthRedirectUrl,
    mcpClientName,
    mcpClientVersion,
  };

  const authProvider: OAuthClientProvider = {
    redirectUrl: client.redirectUrl,
    // this is used to create an oauth client via dynamic client registration
    clientMetadata: {
      redirect_uris: [client.redirectUrl],
      client_name: oauthClientName || mcpClientName,
      client_uri: oauthClientUri,
      scope: oauthScopes,
      token_endpoint_auth_method: oauthPublicClient ? "none" : undefined,
    },
    state: () => state,
    clientInformation: () => {
      if (!client.clientId) {
        return undefined;
      }

      return {
        client_id: client.clientId,
        client_secret: client.clientSecret,
      };
    },
    saveClientInformation: (newInfo: OAuthClientInformationFull) => {
      const completedRegistration = !client.clientId && newInfo.client_id;
      let clientId: string;

      if (completedRegistration) {
        // Associate state with new client ID and save client information
        store.write(state, newInfo.client_id);
        clientId = newInfo.client_id;
      } else {
        clientId = client.clientId!;
      }

      const clientInfo = {
        clientId: newInfo.client_id,
        clientSecret: newInfo.client_secret,
        mcpEndpoint,
        redirectUrl: oauthRedirectUrl,
        mcpClientName,
        mcpClientVersion,
      };
      client = { ...client, ...clientInfo };
      store.write(clientId, clientInfo);
    },
    tokens: () => {
      if (!client.accessToken) return undefined;
      return { access_token: client.accessToken, token_type: "Bearer" };
    },
    saveTokens: ({ access_token, refresh_token }) => {
      store.write(client.clientId!, {
        ...client,
        accessToken: access_token,
        refreshToken: refresh_token,
      });
    },
    redirectToAuthorization: (url) => {
      redirect(url.toString());
    },
    // TODO: something is off here, verifier is saved pre-registration
    // need to look into this
    saveCodeVerifier: (verifier: string) => {
      const verifierKey = `${CODE_VERIFIER_PREFIX}${client.clientId || state}`;
      store.write(verifierKey, verifier);
    },
    codeVerifier: () => {
      const verifierKey = `${CODE_VERIFIER_PREFIX}${client.clientId || state}`;
      const storedVerifier = store.read(verifierKey);

      if (storedVerifier) {
        return storedVerifier;
      }

      // The SDK will generate a new verifier if we return undefined
      return undefined;
    },
  };

  const transport = new StreamableHTTPClientTransport(
    new URL(client.mcpEndpoint!),
    { authProvider }
  );

  const mcpClient = new Client({
    name: "Clerk MCP Demo",
    version: "0.0.1",
  });

  return { transport, client: mcpClient, authProvider };
}

// export function createMcpClient(params: TransportParams) {
//   const { clientId, clientSecret, oauthCallbackUrl, mcpEndpoint } = params;
//   const state = randomUUID();

//   // Handle different initialization scenarios
//   if (!clientId) {
//     // Scenario 1: Dynamic client registration (no clientId)
//     debug("Creating transport with dynamic registration");
//     return createNewTransportWithDynamicRegistration(
//       state,
//       mcpEndpoint,
//       oauthCallbackUrl
//     );
//   } else if (clientId && clientSecret && mcpEndpoint && oauthCallbackUrl) {
//     debug("Creating transport with known credentials");
//     // Scenario 2: Known client without dynamic registration
//     return createTransportWithKnownCredentials(
//       state,
//       clientId,
//       clientSecret,
//       mcpEndpoint,
//       oauthCallbackUrl
//     );
//   } else {
//     // Scenario 3: Existing client, known client id (OAuth callback or tool
//     // call)
//     debug("Creating transport for existing client");
//     return createTransportForExistingClient(state, clientId);
//   }
// }

// /**
//  * Creates a transport for a new client that requires dynamic registration
//  */
// function createNewTransportWithDynamicRegistration(
//   state: string,
//   mcpEndpoint?: string,
//   oauthCallbackUrl?: string
// ) {
//   debug("Dynamic registration", state, mcpEndpoint, oauthCallbackUrl);

//   if (!mcpEndpoint) {
//     throw new Error("MCP endpoint is required");
//   }

//   if (!oauthCallbackUrl) {
//     throw new Error("OAuth callback URL is required");
//   }

//   const client: ClientInfo = {
//     mcpEndpoint,
//     oauthCallbackUrl,
//   };

//   return buildTransport(state, client);
// }

// /**
//  * Creates a transport with known client credentials without needing registration
//  */
// function createTransportWithKnownCredentials(
//   state: string,
//   clientId: string,
//   clientSecret: string,
//   mcpEndpoint: string,
//   oauthCallbackUrl: string
// ) {
//   debug(
//     "Known credentials",
//     state,
//     clientId,
//     clientSecret,
//     mcpEndpoint,
//     oauthCallbackUrl
//   );

//   const client = fsStore.read(clientId) || {};

//   client.client_id = clientId;
//   client.client_secret = clientSecret;
//   client.mcpEndpoint = mcpEndpoint;
//   client.oauthCallbackUrl = oauthCallbackUrl;

//   fsStore.write(clientId, client);
//   fsStore.write(state, clientId);

//   return buildTransport(state, client);
// }

// /**
//  * Creates a transport for an existing client (OAuth callback or tool call)
//  */
// function createTransportForExistingClient(state: string, clientId: string) {
//   debug("Existing client", state, clientId);

//   const client = fsStore.read(clientId);

//   if (!client) {
//     throw new Error(`Client with ID ${clientId} not found in store`);
//   }

//   return buildTransport(state, client);
// }

// const CODE_VERIFIER_PREFIX = "pkce_verifier_";

// /**
//  * Builds the transport with the configured client information
//  */
// function buildTransport(state: string, client: ClientInfo) {
//   const authProvider: OAuthClientProvider = {
//     redirectUrl: client.oauthCallbackUrl!,
//     // this info is used specifically to create an oauth client via dynamic
//     // client registration
//     clientMetadata: {
//       redirect_uris: [client.oauthCallbackUrl!],
//       client_name: "Test Client",
//       client_uri: "https://example.com",
//       scope: "openid profile email",
//       // uncomment this to make a public client
//       // token_endpoint_auth_method: "none",
//     },
//     state: () => state,
//     clientInformation: () => {
//       if (!client.client_id) {
//         return undefined;
//       }
//       // TODO: this should return the full client object
//       // it would need to exclude my custom additions mcpEndpoint and
//       // oauthCallbackUrl though
//       return {
//         client_id: client.client_id,
//         client_secret: client.client_secret,
//       };
//     },
//     saveClientInformation: (newInfo: OAuthClientInformationFull) => {
//       debug("saving client info", newInfo);
//       const completedClientRegistration =
//         !client.client_id && newInfo.client_id;

//       if (completedClientRegistration) {
//         // Associate state with new client ID and save client information
//         fsStore.write(state, newInfo.client_id);
//         fsStore.write(newInfo.client_id, { ...client, ...newInfo });
//         client = { ...client, ...newInfo };
//       } else {
//         // Update existing client information
//         fsStore.write(client.client_id!, { ...client, ...newInfo });
//       }
//     },
//     tokens: () => {
//       if (!client.accessToken) return undefined;
//       return { access_token: client.accessToken, token_type: "Bearer" };
//     },
//     saveTokens: ({ access_token, refresh_token }) => {
//       fsStore.write(client.client_id!, {
//         ...client,
//         accessToken: access_token,
//         refreshToken: refresh_token,
//       });
//     },
//     redirectToAuthorization: (url) => {
//       redirect(url.toString());
//     },
//     saveCodeVerifier: (verifier: string) => {
//       const verifierKey = `${CODE_VERIFIER_PREFIX}${client.client_id || state}`;
//       debug(`Saving code verifier for client ${client.client_id || state}`);
//       fsStore.write(verifierKey, verifier);
//     },
//     codeVerifier: () => {
//       const verifierKey = `${CODE_VERIFIER_PREFIX}${client.client_id}`;
//       const storedVerifier = fsStore.read(verifierKey);

//       if (storedVerifier) {
//         debug(
//           `Retrieved stored code verifier for client ${
//             client.client_id || state
//           }: ${storedVerifier}`
//         );
//         return storedVerifier;
//       }

//       debug(`No code verifier found for client ${client.client_id}`);

//       // The SDK will generate a new verifier if we return undefined
//       return undefined;
//     },
//   };

//   debug("Creating transport with MCP endpoint:", client.mcpEndpoint);
//   const transport = new StreamableHTTPClientTransport(
//     new URL(client.mcpEndpoint!),
//     { authProvider }
//   );

//   debug("Creating MCP client");
//   const mcpClient = new Client({
//     name: "Clerk MCP Demo",
//     version: "0.0.1",
//   });

//   return { transport, client: mcpClient, authProvider };
// }
