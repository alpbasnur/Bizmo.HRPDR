import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { randomUUID } from "crypto";

const traceIdPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", (request, _reply, done) => {
    const traceId =
      (request.headers["x-trace-id"] as string | undefined) ?? randomUUID();
    request.traceId = traceId;
    done();
  });

  fastify.addHook("onSend", (_request, reply, _payload, done) => {
    reply.header("x-trace-id", (_request as { traceId?: string }).traceId ?? "");
    done();
  });
};

export default fp(traceIdPlugin, { name: "traceId" });
