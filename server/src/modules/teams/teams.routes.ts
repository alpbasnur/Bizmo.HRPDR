import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";

const teamsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", fastify.authenticate);

  fastify.get<{
    Querystring: { departmentId?: string };
  }>("/", async (request, reply) => {
    try {
      const orgId = request.user.orgId!;
      const departmentId = request.query.departmentId;

      const teams = await prisma.team.findMany({
        where: {
          organizationId: orgId,
          deletedAt: null,
          ...(departmentId ? { departmentId } : {}),
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          departmentId: true,
        },
      });

      return reply.send({ data: teams });
    } catch (err) {
      request.log.error(err, "teams.list failed");
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Ekipler listelenirken hata oluştu",
        traceId: request.traceId,
      });
    }
  });
};

export default teamsRoutes;
