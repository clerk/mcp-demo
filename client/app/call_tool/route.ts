import { createMcpClient } from "@/lib/mcp-client";

export async function POST(request: Request) {
  const res = await request.json();
  const { transport, client } = createMcpClient({ clientId: res.clientId });

  await client.connect(transport);

  const toolRes = await client.callTool({
    name: "roll_dice",
    arguments: { sides: 6 },
  });

  return Response.json(toolRes);
}
