import type { FastifyReply, FastifyRequest } from "fastify";
import type { JwtPayload } from "./jwt-payload.js";

type AuthPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<FastifyReply | void>;

declare module "fastify" {
  interface FastifyRequest {
    traceId: string;
    user?: JwtPayload;
  }

  interface FastifyInstance {
    authenticate: AuthPreHandler;
    authenticatePortal: AuthPreHandler;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export {};
