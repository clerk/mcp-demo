export function deriveFapiUrl() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set");
  }
  const key = publishableKey.replace(/^pk_(test|live)_/, "");
  const decoded = Buffer.from(key, "base64").toString("utf8");
  return "https://" + decoded.replace(/\$/, "");
}
