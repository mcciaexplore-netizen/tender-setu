import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@/utils/jwt";
import { AppError } from "@/middleware/error";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError(401, "Authorization header missing or malformed"));
  }

  const token = authHeader.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token"));
  }
}

/** Middleware that verifies a static SCRAPER_API_KEY header for ingest routes. */
export function requireScraperKey(req: Request, _res: Response, next: NextFunction): void {
  const key = req.headers["x-scraper-api-key"];
  const expected = process.env.SCRAPER_API_KEY;
  if (!expected || key !== expected) {
    return next(new AppError(401, "Invalid or missing scraper API key"));
  }
  next();
}
