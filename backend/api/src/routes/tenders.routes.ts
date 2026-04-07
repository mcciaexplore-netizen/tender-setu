import { Router } from "express";
import { listTenders, getTenderStats, getTender } from "@/controllers/tenders.controller";

const router = Router();

// NOTE: /stats must be registered BEFORE /:id to avoid Express matching
// "stats" as an id param.
router.get("/stats", getTenderStats);
router.get("/", listTenders);
router.get("/:id", getTender);

export default router;
