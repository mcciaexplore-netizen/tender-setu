import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z
    .string()
    .regex(/^\+91[6-9]\d{9}$/, "Phone must be a valid Indian mobile number (+91XXXXXXXXXX)"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  companyName: z.string().min(2).max(200),
  udyamNumber: z.string().optional(),
  gstNumber: z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .optional(),
  turnover: z.number().positive().optional(),
  state: z.string().min(2),
  district: z.string().min(2),
  preferredCategories: z
    .array(
      z.enum([
        "CONSTRUCTION", "IT_SERVICES", "MEDICAL", "ELECTRICAL",
        "STATIONERY", "TRANSPORTATION", "PLUMBING", "CONSULTING", "OTHER",
      ])
    )
    .optional()
    .default([]),
  preferredStates: z.array(z.string()).optional().default([]),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
