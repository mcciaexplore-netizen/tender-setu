// Augment express-serve-static-core so that req.user is available
// on every Express Request after the requireAuth middleware runs.
import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      userId: string;
      email: string;
    };
  }
}
