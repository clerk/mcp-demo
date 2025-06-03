import { redirect } from "next/navigation";
import { completeOAuthHandler } from "@clerk/mcp-tools/next";
import fsStore from "@clerk/mcp-tools/stores/fs";

const handler = completeOAuthHandler({
  store: fsStore,
  callback: () => redirect("/"),
});

export { handler as GET };
