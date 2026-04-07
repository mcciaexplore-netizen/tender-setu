import { Router } from "express";
import { ingestTenders } from "@/controllers/scrapers.controller";
import { requireScraperKey } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { ingestSchema } from "@/schemas/tender.schema";

const router = Router();

// Protected by a static API key (not JWT) — scrapers are server-to-server
router.post("/ingest", requireScraperKey, validate(ingestSchema), ingestTenders);

export default router;
