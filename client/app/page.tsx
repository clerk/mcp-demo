import { cookies } from "next/headers";
import IndexPageClient from "./index_client";

export default async function IndexPage() {
  const cookieStore = await cookies();
  const mcpSession = cookieStore.get("mcp-session");

  return <IndexPageClient initialHasSession={!!mcpSession} />;
}
