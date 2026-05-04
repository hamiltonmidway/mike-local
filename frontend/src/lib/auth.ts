import { NextRequest } from "next/server";

export async function getUserFromRequest(
    request: NextRequest,
): Promise<{ email: string; id: string } | null> {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7);
    const encodedEmail = token.startsWith("local-user:")
        ? token.slice("local-user:".length)
        : "";
    const email = encodedEmail
        ? decodeURIComponent(encodedEmail)
        : (process.env.NEXT_PUBLIC_LOCAL_USER_EMAIL ?? "local@mike.local");
    return {
        email,
        id: process.env.NEXT_PUBLIC_LOCAL_USER_ID ?? "local-user",
    };
}
