export default function createMcpAuthHandler(
  handler: (req: Request) => Promise<Response>,
  verifyToken: (token: string, req: Request) => Promise<boolean>
) {
  return async (req: Request) => {
    const origin = new URL(req.url).origin;

    if (!req.headers.get("Authorization")) {
      return new Response(null, {
        status: 401,
        headers: {
          "WWW-Authenticate": `Bearer resource_metadata=${origin}/.well-known/oauth-protected-resource`,
        },
      });
    } else {
      const authHeader = req.headers.get("Authorization");
      const token = authHeader?.split(" ")[1];

      if (!token) {
        throw new Error(
          `Invalid authorization header value, expected Bearer <token>, received ${authHeader}`
        );
      }

      const isAuthenticated = await verifyToken(token, req);

      if (!isAuthenticated) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    return handler(req);
  };
}
