import { deriveFapiUrl } from "@/lib/derive-fapi-url";

/**
 * OAuth 2.0 Protected Resource Metadata endpoint based on RFC 9728
 * @see https://datatracker.ietf.org/doc/html/rfc9728
 */
export async function protectedResourceHandler(request: Request) {
  const origin = new URL(request.url).origin;
  const fapiUrl = deriveFapiUrl();

  // This will be provided natively via Clerk in the future, but is hard coded
  // for now.
  const metadata = {
    resource: origin,
    authorization_servers: [fapiUrl],
    token_types_supported: ["urn:ietf:params:oauth:token-type:access_token"],
    token_introspection_endpoint: `${fapiUrl}/oauth/token`,
    token_introspection_endpoint_auth_methods_supported: [
      "client_secret_post",
      "client_secret_basic",
    ],
    jwks_uri: `${fapiUrl}/.well-known/jwks.json`,
    service_documentation: "https://clerk.com/docs",
    authorization_data_types_supported: ["oauth_scope"],
    authorization_data_locations_supported: ["header", "body"],
    key_challenges_supported: [
      {
        challenge_type: "urn:ietf:params:oauth:pkce:code_challenge",
        challenge_algs: ["S256"],
      },
    ],
  };

  return Response.json(metadata, {
    headers: {
      "Cache-Control": "max-age=3600",
      "Content-Type": "application/json",
    },
  });
}
