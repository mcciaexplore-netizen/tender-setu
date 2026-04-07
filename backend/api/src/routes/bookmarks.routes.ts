import { Router } from "express";
import {
  createBookmark,
  listBookmarks,
  updateBookmark,
  deleteBookmark,
} from "@/controllers/bookmarks.controller";
import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import { createBookmarkSchema, updateBookmarkSchema } from "@/schemas/bookmark.schema";

const router = Router();

// All bookmark routes require authentication
router.use(requireAuth);

router.post("/", validate(createBookmarkSchema), createBookmark);
router.get("/", listBookmarks);
router.patch("/:id", validate(updateBookmarkSchema), updateBookmark);
router.delete("/:id", deleteBookmark);

export default router;
