import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import tendersRouter from "@/routes/tenders.routes";
import authRouter from "@/routes/auth.routes";
import bookmarksRouter from "@/routes/bookmarks.routes";
import alertsRouter from "@/routes/alerts.routes";
import scrapersRouter from "@/routes/scrapers.routes";
import { errorHandler } from "@/middleware/error";

const app = express();

// ─── Security & parsing ───────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Scraper-Api-Key"],
  })
);
app.use(express.json({ limit: "5mb" })); // 5 MB for scraper HTML payloads

// ─── Rate limiting (100 req / min per IP) ────────────────────────────────────
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use("/api/tenders", tendersRouter);
app.use("/api/auth", authRouter);
app.use("/api/bookmarks", bookmarksRouter);
app.use("/api/alerts", alertsRouter);
app.use("/api/scrapers", scrapersRouter);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

export default app;
