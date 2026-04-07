import { z } from "zod";

const CATEGORIES = [
  "CONSTRUCTION", "IT_SERVICES", "MEDICAL", "ELECTRICAL",
  "STATIONERY", "TRANSPORTATION", "PLUMBING", "CONSULTING", "OTHER",
] as const;

const PORTALS = [
  "CPPP", "GEM", "MAHATENDERS", "TNTENDERS",
  "RAJASTHAN_EPROC", "IREPS", "OTHER",
] as const;

const STATUSES = ["OPEN", "CLOSING_SOON", "CLOSED", "CANCELLED"] as const;

/** Single tender object accepted by the scraper ingest endpoint. */
export const tenderIngestItemSchema = z.object({
  title: z.string().min(5).max(500),
  referenceNumber: z.string().min(3).max(200),
  description: z.string().default(""),
  issuingAuthority: z.string().min(2).max(300),
  department: z.string().min(2).max(300),
  category: z.enum(CATEGORIES).optional(),  // auto-detected if absent
  state: z.string().min(2),
  district: z.string().default(""),
  city: z.string().default(""),
  estimatedValue: z.number().nonnegative(),
  emdAmount: z.number().nonnegative(),
  publishedDate: z.string().datetime({ message: "publishedDate must be ISO 8601" }),
  submissionDeadline: z.string().datetime({ message: "submissionDeadline must be ISO 8601" }),
  prebidMeetingDate: z.string().datetime().optional(),
  tenderDocUrl: z.string().url(),
  sourceUrl: z.string().url(),
  sourcePortal: z.enum(PORTALS),
  status: z.enum(STATUSES).default("OPEN"),
  rawHtml: z.string().optional(),
  pdfStorageUrl: z.string().url().optional(),
  scrapedAt: z.string().datetime().optional(),
});

export const ingestSchema = z.object({
  tenders: z
    .array(tenderIngestItemSchema)
    .min(1, "At least one tender required")
    .max(500, "Maximum 500 tenders per batch"),
});

export type TenderIngestItem = z.infer<typeof tenderIngestItemSchema>;
export type IngestInput = z.infer<typeof ingestSchema>;
