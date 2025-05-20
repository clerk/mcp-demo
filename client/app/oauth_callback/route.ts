import fsStore from "@/stores/fs";
import { type NextRequest } from "next/server";
import { default as _debug } from "debug";
import { redirect } from "next/navigation";
import { createTransport } from "@/lib/create-transport";

const debug = _debug("mcp-demo-oauth-callback");

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams;
  const code = qs.get("code");
  const state = qs.get("state");

  debug("OAuth callback code/state", code, state);

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

  const clientId = fsStore.read(state);
  debug("Client ID from state", clientId);
  const transport = createTransport({ clientId });

  transport.finishAuth(code);

  return redirect(`/?client_id=${clientId}`);
}
