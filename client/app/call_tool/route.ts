import { cookies } from "next/headers";
import { getClientBySessionId } from "@clerk/mcp-tools/client";
import fsStore from "@clerk/mcp-tools/stores/fs";

// TODO: this type shouldn't be needed
interface ToolResponseContentType {
  type: string;
  text: string;
}

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("mcp-session")?.value;

  if (!sessionId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { connect, client } = await getClientBySessionId({
    sessionId,
    store: fsStore,
  });

  await connect();

  const toolRes = await client.callTool({
    name: "get-clerk-user-data",
    arguments: {},
  });

  // User data is returned under the .content property as stringified JSON
  const user = JSON.parse(
    (toolRes.content as ToolResponseContentType[])[0].text
  );

  // Just return some of the data as an example
  return Response.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.emailAddresses[0].emailAddress,
  });
}
