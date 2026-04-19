import type { FastifyRequest, FastifyReply } from "fastify";
import type { JwtPayload } from "../types/jwt-payload.js";

export type { JwtPayload };

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify<JwtPayload>();
    if (request.user.type === "portal" || request.user.type === "portal_refresh") {
      return reply.status(403).send({
        code: "PORTAL_TOKEN_NOT_ALLOWED",
        message: "Bu endpoint yönetici hesabı gerektiriyor",
        traceId: request.traceId,
      });
    }
  } catch {
    return reply.status(401).send({
      code: "UNAUTHORIZED",
      message: "Kimlik doğrulaması başarısız",
      traceId: request.traceId,
    });
  }
}

export async function authenticatePortal(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify<JwtPayload>();
    if (request.user.type !== "portal") {
      return reply.status(403).send({
        code: "ADMIN_TOKEN_NOT_ALLOWED",
        message: "Bu endpoint personel hesabı gerektiriyor",
        traceId: request.traceId,
      });
    }
  } catch {
    return reply.status(401).send({
      code: "UNAUTHORIZED",
      message: "Kimlik doğrulaması başarısız",
      traceId: request.traceId,
    });
  }
}
