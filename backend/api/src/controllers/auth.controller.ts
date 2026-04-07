import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "@db";
import { signToken } from "@/utils/jwt";
import { catchAsync } from "@/utils/catchAsync";
import { AppError } from "@/middleware/error";
import type { RegisterInput, LoginInput } from "@/schemas/auth.schema";

const BCRYPT_ROUNDS = 12;

// ─── POST /api/auth/register ──────────────────────────────────────────────────
export const register = catchAsync(async (req: Request, res: Response) => {
  const body = req.body as RegisterInput;

  const hashedPassword = await bcrypt.hash(body.password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email.toLowerCase(),
      phone: body.phone,
      password: hashedPassword,
      companyName: body.companyName,
      udyamNumber: body.udyamNumber,
      gstNumber: body.gstNumber,
      turnover: body.turnover,
      state: body.state,
      district: body.district,
      preferredCategories: body.preferredCategories ?? [],
      preferredStates: body.preferredStates ?? [],
    },
    select: {
      id: true, name: true, email: true, phone: true,
      companyName: true, state: true, district: true,
      isVerified: true, createdAt: true,
    },
  });

  const token = signToken({ userId: user.id, email: user.email });

  res.status(201).json({ token, user });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Constant-time rejection (don't reveal whether email exists)
  const validPassword = user
    ? await bcrypt.compare(password, user.password)
    : await bcrypt.hash("dummy", 1).then(() => false);

  if (!user || !validPassword) {
    throw new AppError(401, "Invalid email or password");
  }

  const token = signToken({ userId: user.id, email: user.email });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      companyName: user.companyName,
      state: user.state,
      district: user.district,
      preferredCategories: user.preferredCategories,
      preferredStates: user.preferredStates,
      isVerified: user.isVerified,
    },
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true, name: true, email: true, phone: true,
      companyName: true, udyamNumber: true, gstNumber: true,
      turnover: true, state: true, district: true,
      preferredCategories: true, preferredStates: true,
      isVerified: true, createdAt: true,
    },
  });

  if (!user) throw new AppError(404, "User not found");
  res.json({ data: user });
});
