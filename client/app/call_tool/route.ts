import { getClientById } from "../../../clerk-mcp-tools/mcp-client";
import fsStore from "../../../clerk-mcp-tools/stores/fs";

export async function POST(request: Request) {
  const res = await request.json();

  const { transport, client } = getClientById({
    clientId: res.clientId,
    store: fsStore,
  });

  await client.connect(transport);

  const toolRes = await client.callTool({
    name: "roll_dice",
    arguments: { sides: 6 },
  });

  return Response.json(toolRes);
}
