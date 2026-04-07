import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Known application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      issues: err.errors.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // Prisma known request errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ error: "A record with that value already exists" });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: "Record not found" });
      return;
    }
  }

  // JWT errors
  if (err instanceof Error && err.name === "JsonWebTokenError") {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  if (err instanceof Error && err.name === "TokenExpiredError") {
    res.status(401).json({ error: "Token expired" });
    return;
  }

  // Unknown errors
  const isDev = process.env.NODE_ENV === "development";
  const message = err instanceof Error ? err.message : "Internal server error";
  console.error("[ERROR]", err);

  res.status(500).json({
    error: "Internal server error",
    ...(isDev && { detail: message }),
  });
}
