"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function disconnectSession() {
  const cookieStore = await cookies();

  // Delete the HttpOnly cookie by setting it with an expired date
  cookieStore.set("mcp-session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0), // Expire immediately
    path: "/",
  });

  // Redirect to home page
  redirect("/");
}
