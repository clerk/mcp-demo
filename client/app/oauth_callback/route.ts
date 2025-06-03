import { redirect } from "next/navigation";
import fsStore from "@clerk/mcp-tools/stores/fs";
import { completeOAuthHandler } from "@clerk/mcp-tools/next";

const handler = completeOAuthHandler({
  store: fsStore,
  callback: () => redirect("/"),
});

export { handler as GET };
