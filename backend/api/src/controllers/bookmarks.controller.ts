import { Request, Response } from "express";
import { prisma } from "@db";
import { catchAsync } from "@/utils/catchAsync";
import { AppError } from "@/middleware/error";
import type { CreateBookmarkInput, UpdateBookmarkInput } from "@/schemas/bookmark.schema";

// ─── POST /api/bookmarks ──────────────────────────────────────────────────────
export const createBookmark = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { tenderId, stage, notes } = req.body as CreateBookmarkInput;

  // Verify tender exists
  const tender = await prisma.tender.findUnique({
    where: { id: tenderId },
    select: { id: true },
  });
  if (!tender) throw new AppError(404, "Tender not found");

  const bookmark = await prisma.bookmark.create({
    data: { userId, tenderId, stage, notes },
    include: {
      tender: {
        select: {
          id: true, title: true, referenceNumber: true,
          issuingAuthority: true, category: true,
          state: true, estimatedValue: true,
          submissionDeadline: true, status: true,
        },
      },
    },
  });

  res.status(201).json({ data: bookmark });
});

// ─── GET /api/bookmarks ───────────────────────────────────────────────────────
export const listBookmarks = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      tender: {
        select: {
          id: true, title: true, referenceNumber: true,
          issuingAuthority: true, department: true,
          category: true, state: true, district: true,
          estimatedValue: true, emdAmount: true,
          submissionDeadline: true, publishedDate: true,
          status: true, sourcePortal: true, tenderDocUrl: true,
        },
      },
    },
  });

  res.json({ data: bookmarks, total: bookmarks.length });
});

// ─── PATCH /api/bookmarks/:id ─────────────────────────────────────────────────
export const updateBookmark = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const body = req.body as UpdateBookmarkInput;

  const existing = await prisma.bookmark.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!existing) throw new AppError(404, "Bookmark not found");
  if (existing.userId !== userId) throw new AppError(403, "Not your bookmark");

  const bookmark = await prisma.bookmark.update({
    where: { id },
    data: body,
    include: {
      tender: {
        select: {
          id: true, title: true, category: true,
          status: true, submissionDeadline: true,
        },
      },
    },
  });

  res.json({ data: bookmark });
});

// ─── DELETE /api/bookmarks/:id ────────────────────────────────────────────────
export const deleteBookmark = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const existing = await prisma.bookmark.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!existing) throw new AppError(404, "Bookmark not found");
  if (existing.userId !== userId) throw new AppError(403, "Not your bookmark");

  await prisma.bookmark.delete({ where: { id } });
  res.status(204).send();
});
