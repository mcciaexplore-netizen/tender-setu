import { Request, Response } from "express";
import { Prisma, TenderCategory, TenderStatus, SourcePortal } from "@prisma/client";
import { prisma } from "@db";
import { catchAsync } from "@/utils/catchAsync";
import { AppError } from "@/middleware/error";

// ─── Shared tender select (no rawHtml – too large for lists) ──────────────────
const TENDER_LIST_SELECT = {
  id: true, title: true, referenceNumber: true,
  issuingAuthority: true, department: true,
  category: true, state: true, district: true, city: true,
  estimatedValue: true, emdAmount: true,
  publishedDate: true, submissionDeadline: true, prebidMeetingDate: true,
  sourcePortal: true, status: true, tenderDocUrl: true, sourceUrl: true,
  scrapedAt: true, createdAt: true,
} satisfies Prisma.TenderSelect;

const VALID_SORT = ["publishedDate", "submissionDeadline", "estimatedValue"] as const;
type SortField = (typeof VALID_SORT)[number];

const ORDER_BY: Record<SortField, Prisma.TenderOrderByWithRelationInput> = {
  publishedDate: { publishedDate: "desc" },
  submissionDeadline: { submissionDeadline: "asc" },
  estimatedValue: { estimatedValue: "desc" },
};

// ─── GET /api/tenders ─────────────────────────────────────────────────────────
export const listTenders = catchAsync(async (req: Request, res: Response) => {
  const q = req.query as Record<string, string | undefined>;

  const pageNum = Math.max(1, parseInt(q.page ?? "1", 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(q.limit ?? "20", 10) || 20));

  const where: Prisma.TenderWhereInput = {};

  if (q.category) where.category = q.category as TenderCategory;
  if (q.status) where.status = q.status as TenderStatus;
  if (q.sourcePortal) where.sourcePortal = q.sourcePortal as SourcePortal;

  if (q.state) {
    where.state = { contains: q.state, mode: "insensitive" };
  }
  if (q.department) {
    where.department = { contains: q.department, mode: "insensitive" };
  }

  if (q.minValue || q.maxValue) {
    where.estimatedValue = {
      ...(q.minValue && { gte: Number(q.minValue) }),
      ...(q.maxValue && { lte: Number(q.maxValue) }),
    };
  }

  if (q.search) {
    where.OR = [
      { title: { contains: q.search, mode: "insensitive" } },
      { description: { contains: q.search, mode: "insensitive" } },
    ];
  }

  // deadline filter: tenders closing within next N days (3/7/15/30)
  if (q.deadline) {
    const days = parseInt(q.deadline, 10);
    if ([3, 7, 15, 30].includes(days)) {
      const now = new Date();
      const cutoff = new Date(now.getTime() + days * 86_400_000);
      where.submissionDeadline = { gte: now, lte: cutoff };
      // Only override status if user didn't specify one
      if (!q.status) {
        where.status = { in: ["OPEN", "CLOSING_SOON"] };
      }
    }
  }

  const sort = (VALID_SORT as readonly string[]).includes(q.sort ?? "")
    ? (q.sort as SortField)
    : "publishedDate";

  const [tenders, total] = await Promise.all([
    prisma.tender.findMany({
      where,
      orderBy: ORDER_BY[sort],
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      select: TENDER_LIST_SELECT,
    }),
    prisma.tender.count({ where }),
  ]);

  res.json({
    data: tenders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

// ─── GET /api/tenders/stats ───────────────────────────────────────────────────
export const getTenderStats = catchAsync(async (_req: Request, res: Response) => {
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 86_400_000);
  const ACTIVE: TenderStatus[] = ["OPEN", "CLOSING_SOON"];

  const [byCategory, byState, byStatus, totalActive, closingThisWeek] =
    await Promise.all([
      prisma.tender.groupBy({ by: ["category"], _count: { _all: true } }),
      prisma.tender.groupBy({
        by: ["state"],
        _count: { _all: true },
        orderBy: { _count: { id: "desc" } },
        take: 25,
      }),
      prisma.tender.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.tender.count({ where: { status: { in: ACTIVE } } }),
      prisma.tender.count({
        where: {
          submissionDeadline: { gte: now, lte: weekEnd },
          status: { in: ACTIVE },
        },
      }),
    ]);

  res.json({
    totalActive,
    closingThisWeek,
    byCategory: Object.fromEntries(byCategory.map((r) => [r.category, r._count._all])),
    byState: Object.fromEntries(byState.map((r) => [r.state, r._count._all])),
    byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])),
  });
});

// ─── GET /api/tenders/:id ─────────────────────────────────────────────────────
export const getTender = catchAsync(async (req: Request, res: Response) => {
  const tender = await prisma.tender.findUnique({
    where: { id: req.params.id },
  });
  if (!tender) throw new AppError(404, "Tender not found");
  res.json({ data: tender });
});
