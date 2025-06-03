import { cookies } from "next/headers";
import { getClientBySessionId } from "@clerk/mcp-tools/client";
import fsStore from "@clerk/mcp-tools/stores/fs";

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("mcp-session")?.value;

  if (!sessionId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // we need to secure this a bit more i think than just client id
  const { connect, client } = await getClientBySessionId({
    sessionId,
    store: fsStore,
  });

  await connect();

  const toolRes = await client.callTool({
    name: "roll_dice",
    arguments: { sides: 6 },
  });

  return Response.json(toolRes);
}
