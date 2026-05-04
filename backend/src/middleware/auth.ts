import { Request, Response, NextFunction } from "express";
import { ensureLocalUser, getLocalUserFromToken } from "../lib/supabase";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = req.headers.authorization ?? "";
  if (!auth.startsWith("Bearer ")) {
    res.status(401).json({ detail: "Missing or invalid Authorization header" });
    return;
  }

  const token = auth.slice(7).trim();
  const user = getLocalUserFromToken(token);
  ensureLocalUser(user.id, user.email);

  res.locals.userId = user.id;
  res.locals.userEmail = user.email;
  res.locals.token = token;
  next();
}
