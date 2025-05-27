import { type NextRequest } from "next/server";
import { completeAuthWithCode, type ClientStore } from "./mcp-client";

export function completeOAuthHandler({
  store,
  callback,
}: {
  store: ClientStore;
  callback: (params: Awaited<ReturnType<typeof completeAuthWithCode>>) => void;
}) {
  return async (req: NextRequest) => {
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

    // this function will run the state param check internally
    const res = await completeAuthWithCode({ state, code, store });
    return callback(res);
  };
}
