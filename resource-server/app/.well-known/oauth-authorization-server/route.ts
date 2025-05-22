import { deriveFapiUrl } from "@/lib/derive-fapi-url";

/**
 * OAuth 2.0 Authorization Server Metadata endpoint (RFC 8414)
 * @see https://datatracker.ietf.org/doc/html/rfc8414
 * 
 * Note: This should be on the authorization server, not the resource server. 
 * It's provided here because the MCP SDK is not currently implemented 
 * correctly and will go looking for this metadata route on the resource server 
 * by default.
 */
export async function GET() {
  const fapiUrl = deriveFapiUrl();

  const metadata = {
    issuer: fapiUrl,
    authorization_endpoint: `${fapiUrl}/oauth/authorize`,
    registration_endpoint: `${fapiUrl}/oauth/register`,
    token_endpoint: `${fapiUrl}/oauth/token`,
    jwks_uri: `${fapiUrl}/.well-known/jwks.json`,
    response_types_supported: ["code", "token"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["client_secret_post"],
    scopes_supported: ["openid", "profile", "email"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    claims_supported: ["sub", "iss", "aud", "exp", "iat", "email", "name"],
    service_documentation: "https://clerk.com/docs",
    code_challenge_methods_supported: ["S256"],
  };

  return Response.json(metadata, {
    headers: {
      "Cache-Control": "max-age=3600",
      "Content-Type": "application/json",
    },
  });
}
