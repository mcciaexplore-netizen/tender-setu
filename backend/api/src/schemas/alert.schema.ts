import { z } from "zod";

const CATEGORIES = [
  "CONSTRUCTION", "IT_SERVICES", "MEDICAL", "ELECTRICAL",
  "STATIONERY", "TRANSPORTATION", "PLUMBING", "CONSULTING", "OTHER",
] as const;

const alertBase = z.object({
  name: z.string().min(1).max(100),
  categories: z.array(z.enum(CATEGORIES)).default([]),
  states: z.array(z.string().min(2)).default([]),
  minValue: z.number().positive().optional(),
  maxValue: z.number().positive().optional(),
  keywords: z.array(z.string().min(1)).default([]),
  isActive: z.boolean().default(true),
  channel: z.enum(["EMAIL", "SMS", "WHATSAPP"]),
  frequency: z.enum(["INSTANT", "DAILY_DIGEST", "WEEKLY_DIGEST"]),
});

export const createAlertSchema = alertBase.refine(
  (d) => d.minValue === undefined || d.maxValue === undefined || d.minValue < d.maxValue,
  { message: "minValue must be less than maxValue", path: ["minValue"] }
);

export const updateAlertSchema = alertBase
  .partial()
  .refine(
    (d) => Object.keys(d).length > 0,
    { message: "Provide at least one field to update" }
  );

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
