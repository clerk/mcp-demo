import fsStore from "@/stores/fs";
import { type NextRequest } from "next/server";
import { default as _debug } from "debug";
import { redirect } from "next/navigation";

const debug = _debug("mcp-demo-oauth-callback");

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams;
  const code = qs.get("code");
  const state = qs.get("state");

  if (!state) {
    debug("Missing state in querystring", req.url, req.nextUrl, qs);
    return Response.json({ error: "State missing" }, { status: 400 });
  }

  if (!code) {
    debug("Missing code in querystring", req.url, req.nextUrl, qs);
    return Response.json(
      { error: "Authorization code missing" },
      { status: 400 }
    );
  }

  const clientInfo = fsStore.read(state);

  debug("Code, state, client info:", code, state, clientInfo);

  if (!clientInfo) {
    return Response.json({ error: "State param mismatch" }, { status: 400 });
  }

  let response;
  try {
    const tokenRequest = new URLSearchParams({
      client_id: clientInfo.clientId,
      client_secret: clientInfo.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: clientInfo.callback,
    }).toString();

    debug("Request body being sent to /oauth/token", tokenRequest);

    response = await fetch(`${clientInfo.authServerUrl}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: tokenRequest,
    }).then((res) => res.json());
  } catch (err) {
    console.error(err);
  }

  debug("Response from /oauth/token endpoint", response);

  // persist the client id and token in the fs store
  // we will need this
  fsStore.write(clientInfo.clientId, {
    oat: response.access_token,
    mcpEndpoint: clientInfo.mcpEndpoint,
    callbackUrl: clientInfo.callbackUrl,
  });

  return redirect(`/?client_id=${clientInfo.clientId}`);
}
