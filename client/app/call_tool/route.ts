import { default as _debug } from "debug";
import { createTransport } from "@/lib/create-transport";

const debug = _debug("mcp-demo-client-tool-call");

export async function POST(request: Request) {
  const res = await request.json();
  debug("calling tool for client: ", res.clientId);

  const { transport, client } = createTransport({ clientId: res.clientId });

  await client.connect(transport);

  const toolRes = await client.callTool({
    name: "roll_dice",
    arguments: { sides: 6 },
  });

  return Response.json(toolRes);
}
