import { Request, Response } from "express";
import { prisma } from "@db";
import { catchAsync } from "@/utils/catchAsync";
import { AppError } from "@/middleware/error";
import type { CreateAlertInput, UpdateAlertInput } from "@/schemas/alert.schema";

// ─── POST /api/alerts ─────────────────────────────────────────────────────────
export const createAlert = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const body = req.body as CreateAlertInput;

  const alert = await prisma.alert.create({
    data: {
      userId,
      name: body.name,
      categories: body.categories ?? [],
      states: body.states ?? [],
      minValue: body.minValue,
      maxValue: body.maxValue,
      keywords: body.keywords ?? [],
      isActive: body.isActive ?? true,
      channel: body.channel,
      frequency: body.frequency,
    },
  });

  res.status(201).json({ data: alert });
});

// ─── GET /api/alerts ──────────────────────────────────────────────────────────
export const listAlerts = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const alerts = await prisma.alert.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  res.json({ data: alerts, total: alerts.length });
});

// ─── PATCH /api/alerts/:id ────────────────────────────────────────────────────
export const updateAlert = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;
  const body = req.body as UpdateAlertInput;

  const existing = await prisma.alert.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!existing) throw new AppError(404, "Alert not found");
  if (existing.userId !== userId) throw new AppError(403, "Not your alert");

  const alert = await prisma.alert.update({ where: { id }, data: body });
  res.json({ data: alert });
});

// ─── DELETE /api/alerts/:id ───────────────────────────────────────────────────
export const deleteAlert = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const existing = await prisma.alert.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!existing) throw new AppError(404, "Alert not found");
  if (existing.userId !== userId) throw new AppError(403, "Not your alert");

  await prisma.alert.delete({ where: { id } });
  res.status(204).send();
});
