/**
 * OAuth 2.0 Authorization Server Metadata endpoint (RFC 8414)
 * @see https://datatracker.ietf.org/doc/html/rfc8414
 */
export async function GET() {
  const metadata = {
    issuer: "https://winning-antelope-92.clerk.accounts.dev",
    authorization_endpoint:
      "https://winning-antelope-92.clerk.accounts.dev/oauth/authorize",
    registration_endpoint:
      "https://winning-antelope-92.clerk.accounts.dev/oauth/register",
    token_endpoint:
      "https://winning-antelope-92.clerk.accounts.dev/oauth/token",
    jwks_uri:
      "https://winning-antelope-92.clerk.accounts.dev/.well-known/jwks.json",
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
