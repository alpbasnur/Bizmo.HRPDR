import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";

const notificationRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", fastify.authenticate);

  // GET / — list notifications for current user
  fastify.get<{
    Querystring: { unreadOnly?: string; page?: string; pageSize?: string };
  }>("/", async (request, reply) => {
    const userId = request.user.sub;

    try {
      const unreadOnly = request.query.unreadOnly === "true";
      const page = Math.max(1, parseInt(request.query.page ?? "1", 10) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(request.query.pageSize ?? "20", 10) || 20));
      const skip = (page - 1) * pageSize;

      const where = {
        userId,
        ...(unreadOnly && { readAt: null }),
      };

      const [total, notifications] = await Promise.all([
        prisma.notification.count({ where }),
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
        }),
      ]);

      return reply.send({
        data: notifications,
        meta: { total, page, pageSize },
      });
    } catch (err) {
      request.log.error(err, "notifications.list failed");
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Bildirimler listelenirken hata oluştu",
        traceId: request.traceId,
      });
    }
  });

  // POST /:id/read — mark notification as read
  fastify.post<{ Params: { id: string } }>("/:id/read", async (request, reply) => {
    const userId = request.user.sub;
    const { id } = request.params;

    try {
      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        return reply.status(404).send({
          code: "NOT_FOUND",
          message: "Bildirim bulunamadı",
          traceId: request.traceId,
        });
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { readAt: new Date() },
      });

      return reply.send({ data: updated });
    } catch (err) {
      request.log.error(err, "notifications.read failed");
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Bildirim okundu olarak işaretlenirken hata oluştu",
        traceId: request.traceId,
      });
    }
  });

  // POST /read-all — mark all unread notifications as read
  fastify.post("/read-all", async (request, reply) => {
    const userId = request.user.sub;

    try {
      const result = await prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      });

      return reply.send({ data: { updated: result.count } });
    } catch (err) {
      request.log.error(err, "notifications.readAll failed");
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Bildirimler okundu olarak işaretlenirken hata oluştu",
        traceId: request.traceId,
      });
    }
  });

  // DELETE /:id — delete notification
  fastify.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const userId = request.user.sub;
    const { id } = request.params;

    try {
      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        return reply.status(404).send({
          code: "NOT_FOUND",
          message: "Bildirim bulunamadı",
          traceId: request.traceId,
        });
      }

      await prisma.notification.delete({ where: { id } });

      return reply.send({ data: { ok: true } });
    } catch (err) {
      request.log.error(err, "notifications.delete failed");
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Bildirim silinirken hata oluştu",
        traceId: request.traceId,
      });
    }
  });
};

export default notificationRoutes;
