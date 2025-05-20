import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { default as _debug } from "debug";
import { createTransport } from "@/lib/create-transport";

const debug = _debug("mcp-demo-client-tool-call");

export async function POST(request: Request) {
  const res = await request.json();
  debug("client id: ", res);

  const transport = createTransport({ clientId: res.clientId });

  const client = new Client({
    name: "Clerk MCP Demo",
    version: "0.0.1",
  });

  await client.connect(transport);

  const toolRes = await client.callTool({
    name: "roll_dice",
    arguments: { sides: 6 },
  });

  debug("tool response", toolRes);

  return Response.json(toolRes);
}
