export function createServerSupabase() {
    return null;
}

export async function getUserIdFromRequest(req: Request): Promise<string> {
    const auth = req.headers.get("authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
        throw new Response("Missing or invalid Authorization header", {
            status: 401,
        });
    }
    return process.env.NEXT_PUBLIC_LOCAL_USER_ID ?? "local-user";
}
