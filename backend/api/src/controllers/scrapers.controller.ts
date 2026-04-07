import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "@db";
import { catchAsync } from "@/utils/catchAsync";
import { detectCategory } from "@/utils/categoryDetector";
import type { IngestInput } from "@/schemas/tender.schema";

// ─── POST /api/scrapers/ingest ────────────────────────────────────────────────
export const ingestTenders = catchAsync(async (req: Request, res: Response) => {
  const { tenders } = req.body as IngestInput;

  let created = 0;
  let updated = 0;
  let errors = 0;
  const errorDetails: string[] = [];

  for (const raw of tenders) {
    try {
      const category = raw.category ?? detectCategory(raw.title, raw.description);

      const data: Prisma.TenderCreateInput = {
        title: raw.title,
        referenceNumber: raw.referenceNumber,
        description: raw.description,
        issuingAuthority: raw.issuingAuthority,
        department: raw.department,
        category,
        state: raw.state,
        district: raw.district,
        city: raw.city,
        estimatedValue: raw.estimatedValue,
        emdAmount: raw.emdAmount,
        publishedDate: new Date(raw.publishedDate),
        submissionDeadline: new Date(raw.submissionDeadline),
        prebidMeetingDate: raw.prebidMeetingDate ? new Date(raw.prebidMeetingDate) : null,
        tenderDocUrl: raw.tenderDocUrl,
        sourceUrl: raw.sourceUrl,
        sourcePortal: raw.sourcePortal,
        status: raw.status,
        rawHtml: raw.rawHtml,
        pdfStorageUrl: raw.pdfStorageUrl,
        scrapedAt: raw.scrapedAt ? new Date(raw.scrapedAt) : new Date(),
      };

      const existing = await prisma.tender.findFirst({
        where: {
          referenceNumber: raw.referenceNumber,
          sourcePortal: raw.sourcePortal,
        },
        select: { id: true },
      });

      if (existing) {
        await prisma.tender.update({
          where: { id: existing.id },
          data,
        });
        updated++;
      } else {
        await prisma.tender.create({ data });
        created++;
      }
    } catch (err) {
      errors++;
      const msg = err instanceof Error ? err.message : String(err);
      errorDetails.push(`[${raw.referenceNumber}] ${msg}`);
      console.error(`[ingest] error on ${raw.referenceNumber}:`, msg);
    }
  }

  res.status(errors > 0 && created + updated === 0 ? 422 : 200).json({
    created,
    updated,
    errors,
    total: tenders.length,
    ...(errorDetails.length > 0 && { errorDetails }),
  });
});
