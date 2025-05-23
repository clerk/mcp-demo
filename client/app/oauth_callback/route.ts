import fsStore from "@/stores/fs";
import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createMcpClient } from "@/lib/mcp-client";

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams;
  const code = qs.get("code");
  const state = qs.get("state");

  if (!state) {
    return Response.json({ error: "State missing" }, { status: 400 });
  }

  if (!code) {
    return Response.json(
      { error: "Authorization code missing" },
      { status: 400 }
    );
  }

  // If the state does not match the initial request, it won't be able to be 
  // read out of the store, so this store read effectively acts as a state 
  // param check.
  const clientId = fsStore.read(state);
  const { transport } = createMcpClient({ clientId });

  transport.finishAuth(code);

  return redirect(`/?client_id=${clientId}`);
}
