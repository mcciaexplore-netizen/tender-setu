import { z } from "zod";

const STAGES = [
  "DISCOVERED", "EVALUATING", "PREPARING", "SUBMITTED", "AWARDED",
] as const;

export const createBookmarkSchema = z.object({
  tenderId: z.string().uuid(),
  stage: z.enum(STAGES).default("DISCOVERED"),
  notes: z.string().max(2000).optional(),
});

export const updateBookmarkSchema = z.object({
  stage: z.enum(STAGES).optional(),
  notes: z.string().max(2000).optional(),
}).refine((d) => d.stage !== undefined || d.notes !== undefined, {
  message: "Provide at least one of: stage, notes",
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>;
