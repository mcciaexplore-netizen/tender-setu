import { Router } from "express";
import {
  createAlert,
  listAlerts,
  updateAlert,
  deleteAlert,
} from "@/controllers/alerts.controller";
import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { createAlertSchema, updateAlertSchema } from "@/schemas/alert.schema";

const router = Router();

// All alert routes require authentication
router.use(requireAuth);

router.post("/", validate(createAlertSchema), createAlert);
router.get("/", listAlerts);
router.patch("/:id", validate(updateAlertSchema), updateAlert);
router.delete("/:id", deleteAlert);

export default router;
