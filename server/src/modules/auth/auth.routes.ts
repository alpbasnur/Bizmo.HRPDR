import type { FastifyPluginAsync } from "fastify";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  loginBodySchema,
  portalLoginBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
} from "./auth.schema.js";
import {
  adminLogin,
  portalLogin,
  hashPassword,
  createPasswordResetToken,
  validateAndConsumeResetToken,
  refreshSecret,
} from "./auth.service.js";
import { prisma } from "../../lib/prisma.js";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // ── Admin Giriş ──────────────────────────────
  fastify.post("/login", async (request, reply) => {
    const body = loginBodySchema.parse(request.body);

    try {
      const result = await adminLogin(
        fastify,
        body.email,
        body.password,
        body.rememberMe
      );

      reply
        .setCookie("refreshToken", result.tokens.refreshToken, {
          httpOnly: true,
          secure: process.env["NODE_ENV"] === "production",
          sameSite: "strict",
          maxAge: body.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
          path: "/api/auth",
        })
        .send({ data: { accessToken: result.tokens.accessToken, user: result.user } });
    } catch {
      reply.status(401).send({
        code: "INVALID_CREDENTIALS",
        message: "E-posta veya şifre hatalı",
        traceId: request.traceId,
      });
    }
  });

  // ── Admin Çıkış ──────────────────────────────
  fastify.post(
    "/logout",
    { onRequest: [fastify.authenticate] },
    async (request, reply) => {
      const sub = request.user?.sub;
      if (!sub) {
        return reply.status(401).send({ code: "UNAUTHORIZED", message: "Oturum bulunamadı", traceId: request.traceId });
      }
      await prisma.user.update({
        where: { id: sub },
        data: { refreshToken: null },
      });
      reply.clearCookie("refreshToken", { path: "/api/auth" }).send({ data: { ok: true } });
    }
  );

  // ── Admin Token Yenileme ─────────────────────
  fastify.post("/refresh", async (request, reply) => {
    const rawToken =
      request.cookies?.["refreshToken"] ??
      (request.body as { refreshToken?: string })?.refreshToken;

    if (!rawToken) {
      return reply.status(401).send({ code: "NO_REFRESH_TOKEN", message: "Yenileme token'ı bulunamadı", traceId: request.traceId });
    }

    try {
      const payload = jwt.verify(rawToken, refreshSecret()) as {
        sub: string;
        type?: string;
      };

      if (payload.type !== "refresh") {
        return reply.status(401).send({ code: "INVALID_REFRESH_TOKEN", message: "Geçersiz token", traceId: request.traceId });
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: { organization: true },
      });

      if (!user || !user.isActive) {
        return reply.status(401).send({ code: "INVALID_REFRESH_TOKEN", message: "Geçersiz token", traceId: request.traceId });
      }

      const valid = bcrypt.compareSync(rawToken, user.refreshToken ?? "");
      if (!valid) {
        return reply.status(401).send({ code: "INVALID_REFRESH_TOKEN", message: "Geçersiz token", traceId: request.traceId });
      }

      const accessToken = fastify.jwt.sign({
        sub: user.id,
        role: user.role,
        orgId: user.organizationId,
      }, { expiresIn: process.env["JWT_EXPIRES_IN"] ?? "15m" });

      return reply.send({ data: { accessToken } });
    } catch {
      return reply.status(401).send({ code: "INVALID_REFRESH_TOKEN", message: "Geçersiz token", traceId: request.traceId });
    }
  });

  // ── Admin Şifre Sıfırlama Talebi ─────────────
  fastify.post("/forgot-password", async (request, reply) => {
    const { email } = forgotPasswordBodySchema.parse(request.body);

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (user) {
      const token = await createPasswordResetToken(user.id);
      fastify.log.info({ action: "password_reset_requested", userId: user.id, token });
    }

    // Güvenlik: kullanıcı var/yok fark etmeksizin aynı yanıt
    return reply.send({
      data: { message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi" },
    });
  });

  // ── Admin Şifre Sıfırlama ─────────────────────
  fastify.post("/reset-password", async (request, reply) => {
    const { token, password } = resetPasswordBodySchema.parse(request.body);

    try {
      const record = await validateAndConsumeResetToken(token);
      if (!record.adminUserId) {
        return reply.status(400).send({ code: "INVALID_TOKEN", message: "Geçersiz token", traceId: request.traceId });
      }

      const hashed = await hashPassword(password);
      await prisma.user.update({
        where: { id: record.adminUserId },
        data: { password: hashed, refreshToken: null },
      });

      return reply.send({ data: { message: "Şifreniz başarıyla güncellendi" } });
    } catch {
      return reply.status(400).send({ code: "INVALID_OR_EXPIRED_TOKEN", message: "Token geçersiz veya süresi dolmuş", traceId: request.traceId });
    }
  });

  // ── Portal Giriş ──────────────────────────────
  fastify.post("/portal/login", async (request, reply) => {
    const body = portalLoginBodySchema.parse(request.body);

    try {
      const result = await portalLogin(fastify, body.employeeId, body.password);
      return reply.send({ data: result });
    } catch {
      return reply.status(401).send({
        code: "INVALID_CREDENTIALS",
        message: "Sicil numarası veya şifre hatalı",
        traceId: request.traceId,
      });
    }
  });

  // ── Portal Token Yenileme ─────────────────────
  fastify.post("/portal/refresh", async (request, reply) => {
    const rawToken = (request.body as { refreshToken?: string })?.refreshToken;
    if (!rawToken) {
      return reply.status(401).send({ code: "NO_REFRESH_TOKEN", message: "Token bulunamadı", traceId: request.traceId });
    }

    try {
      const payload = jwt.verify(rawToken, refreshSecret()) as {
        sub: string;
        type?: string;
      };

      if (payload.type !== "portal_refresh") {
        return reply.status(401).send({ code: "INVALID_REFRESH_TOKEN", message: "Geçersiz token", traceId: request.traceId });
      }

      const personnel = await prisma.personnel.findUnique({
        where: { id: payload.sub },
      });

      if (!personnel || personnel.status !== "ACTIVE") {
        return reply.status(401).send({ code: "INVALID_REFRESH_TOKEN", message: "Geçersiz token", traceId: request.traceId });
      }

      const refreshOk = bcrypt.compareSync(
        rawToken,
        personnel.portalRefreshToken ?? ""
      );
      if (!refreshOk) {
        return reply.status(401).send({ code: "INVALID_REFRESH_TOKEN", message: "Geçersiz token", traceId: request.traceId });
      }

      const accessToken = fastify.jwt.sign(
        { sub: personnel.id, type: "portal", orgId: personnel.organizationId },
        { expiresIn: "1h" }
      );

      return reply.send({ data: { accessToken } });
    } catch {
      return reply.status(401).send({ code: "INVALID_REFRESH_TOKEN", message: "Geçersiz token", traceId: request.traceId });
    }
  });
};

export default authRoutes;
