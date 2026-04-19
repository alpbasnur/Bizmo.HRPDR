import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { hashToken } from "../../lib/crypto.js";
import type { FastifyInstance } from "fastify";

export function refreshSecret(): string {
  return process.env["JWT_REFRESH_SECRET"] ?? process.env["JWT_SECRET"] ?? "dev-secret";
}

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 60 dakika

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function signTokens(
  fastify: FastifyInstance,
  payload: { sub: string; role: string; orgId: string },
  rememberMe = false
): Promise<TokenPair> {
  const accessToken = fastify.jwt.sign(payload, {
    expiresIn: process.env["JWT_EXPIRES_IN"] ?? "15m",
  });

  const refreshTtlSec = rememberMe
    ? 60 * 60 * 24 * 30
    : parseInt(process.env["JWT_REFRESH_EXPIRES_SEC"] ?? `${60 * 60 * 24 * 7}`, 10);

  const refreshToken = jwt.sign(
    { sub: payload.sub, type: "refresh" },
    refreshSecret(),
    { expiresIn: refreshTtlSec }
  );

  await prisma.user.update({
    where: { id: payload.sub },
    data: { refreshToken: await bcrypt.hash(refreshToken, 4) },
  });

  return { accessToken, refreshToken };
}

export async function adminLogin(
  fastify: FastifyInstance,
  email: string,
  password: string,
  rememberMe: boolean
) {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    include: { organization: true },
  });

  if (!user || !user.isActive) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("INVALID_CREDENTIALS");

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const tokens = await signTokens(
    fastify,
    { sub: user.id, role: user.role, orgId: user.organizationId },
    rememberMe
  );

  return {
    tokens,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organization: { id: user.organization.id, name: user.organization.name },
    },
  };
}

export async function portalLogin(
  fastify: FastifyInstance,
  employeeId: string,
  password: string
) {
  const personnel = await prisma.personnel.findFirst({
    where: { employeeId, deletedAt: null },
    include: { organization: true },
  });

  if (!personnel || !personnel.portalPasswordHash || personnel.status !== "ACTIVE") {
    throw new Error("INVALID_CREDENTIALS");
  }

  const valid = await bcrypt.compare(password, personnel.portalPasswordHash);
  if (!valid) throw new Error("INVALID_CREDENTIALS");

  await prisma.personnel.update({
    where: { id: personnel.id },
    data: { lastPortalLogin: new Date() },
  });

  const accessToken = fastify.jwt.sign(
    { sub: personnel.id, type: "portal", orgId: personnel.organizationId },
    { expiresIn: "1h" }
  );

  const portalRefreshToken = jwt.sign(
    { sub: personnel.id, type: "portal_refresh" },
    refreshSecret(),
    { expiresIn: 60 * 60 * 24 }
  );

  await prisma.personnel.update({
    where: { id: personnel.id },
    data: { portalRefreshToken: await bcrypt.hash(portalRefreshToken, 4) },
  });

  return {
    accessToken,
    refreshToken: portalRefreshToken,
    personnel: {
      id: personnel.id,
      employeeId: personnel.employeeId,
      firstName: personnel.firstName,
      lastName: personnel.lastName,
      preferredLanguage: personnel.preferredLanguage,
    },
  };
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function createPasswordResetToken(
  userId?: string,
  personnelId?: string
): Promise<string> {
  const { randomBytes } = await import("crypto");
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      adminUserId: userId,
      personnelId,
    },
  });

  return token;
}

export async function validateAndConsumeResetToken(token: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new Error("INVALID_OR_EXPIRED_TOKEN");
  }

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return record;
}
