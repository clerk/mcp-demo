/**
 * OAuth 2.0 Protected Resource Metadata endpoint based on RFC 9728
 * @see https://datatracker.ietf.org/doc/html/rfc9728
 */
// currently unused but its because the mcp sdk implementation is incorrect
// https://github.com/modelcontextprotocol/modelcontextprotocol/issues/502
export async function GET() {
  // Example metadata values
  // This will be provided natively via Clerk in the future, but is hard coded
  // for now.
  const metadata = {
    resource: "https://localhost:3001",
    authorization_servers: ["https://winning-antelope-92.clerk.accounts.dev"],
    token_types_supported: ["urn:ietf:params:oauth:token-type:access_token"],
    token_introspection_endpoint:
      "https://winning-antelope-92.clerk.accounts.dev/oauth/token",
    token_introspection_endpoint_auth_methods_supported: ["client_secret_post"],
    jwks_uri:
      "https://winning-antelope-92.clerk.accounts.dev/.well-known/jwks.json",
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
