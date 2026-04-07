import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async route handler so thrown errors are forwarded to next().
 * Eliminates boilerplate try/catch in every controller.
 */
export const catchAsync =
  (fn: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
