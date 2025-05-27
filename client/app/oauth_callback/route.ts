import { redirect } from "next/navigation";
import fsStore from "../../../clerk-mcp-tools/stores/fs";
import { completeOAuthHandler } from "../../../clerk-mcp-tools/nextjs";

const handler = completeOAuthHandler({
  store: fsStore,
  callback: ({ clientId }) => redirect(`/?client_id=${clientId}`),
});

export { handler as GET };
