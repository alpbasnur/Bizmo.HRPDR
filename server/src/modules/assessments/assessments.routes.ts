import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function paginate(query: { page?: string; pageSize?: string }) {
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(query.pageSize ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE),
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

const assessmentRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", fastify.authenticate);

  // ── GET / — Değerlendirme listesi ──────────────
  fastify.get<{
    Querystring: { status?: string; search?: string; page?: string; pageSize?: string };
  }>("/", async (request, reply) => {
    try {
      const orgId = request.user.orgId!;
      const { status, search } = request.query;
      const { page, pageSize, skip } = paginate(request.query);

      const where: Record<string, unknown> = { organizationId: orgId };
      if (status) where.status = status;
      if (search) where.title = { contains: search, mode: "insensitive" };

      const [assessments, total] = await Promise.all([
        prisma.assessment.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            questionSet: { select: { id: true, name: true } },
            _count: { select: { sessions: true } },
            sessions: {
              select: { status: true },
            },
          },
        }),
        prisma.assessment.count({ where }),
      ]);

      const data = assessments.map((a) => {
        const completed = a.sessions.filter((s) => s.status === "COMPLETED").length;
        const inProgress = a.sessions.filter((s) => s.status === "IN_PROGRESS").length;
        const { sessions: _sessions, _count, ...rest } = a;
        return {
          ...rest,
          sessionStats: {
            total: _count.sessions,
            completed,
            inProgress,
          },
        };
      });

      return reply.send({ data, meta: { total, page, pageSize } });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Değerlendirmeler alınırken hata oluştu",
        traceId: request.traceId,
      });
    }
  });

  // ── POST / — Yeni değerlendirme ────────────────
  fastify.post<{
    Body: {
      title: string;
      description?: string;
      questionSetId: string;
      startsAt?: string;
      endsAt?: string;
    };
  }>("/", async (request, reply) => {
    try {
      const orgId = request.user.orgId!;
      const { title, description, questionSetId, startsAt, endsAt } = request.body;

      const assessment = await prisma.assessment.create({
        data: {
          title,
          description,
          questionSetId,
          createdById: request.user.sub,
          organizationId: orgId,
          status: "DRAFT",
          startsAt: startsAt ? new Date(startsAt) : undefined,
          endsAt: endsAt ? new Date(endsAt) : undefined,
        },
        include: {
          questionSet: { select: { id: true, name: true } },
        },
      });

      return reply.status(201).send({ data: assessment });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Değerlendirme oluşturulurken hata oluştu",
        traceId: request.traceId,
      });
    }
  });

  // ── GET /:id — Değerlendirme detayı ────────────
  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    try {
      const orgId = request.user.orgId!;
      const assessment = await prisma.assessment.findFirst({
        where: { id: request.params.id, organizationId: orgId },
        include: {
          questionSet: {
            select: { id: true, name: true, description: true, items: { select: { questionId: true, order: true } } },
          },
          _count: { select: { sessions: true } },
          sessions: { select: { status: true } },
        },
      });

      if (!assessment) {
        return reply.status(404).send({
          code: "NOT_FOUND",
          message: "Değerlendirme bulunamadı",
          traceId: request.traceId,
        });
      }

      const completed = assessment.sessions.filter((s) => s.status === "COMPLETED").length;
      const inProgress = assessment.sessions.filter((s) => s.status === "IN_PROGRESS").length;
      const { sessions: _sessions, _count, ...rest } = assessment;

      return reply.send({
        data: {
          ...rest,
          sessionStats: { total: _count.sessions, completed, inProgress },
        },
      });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Değerlendirme alınırken hata oluştu",
        traceId: request.traceId,
      });
    }
  });

  // ── PUT /:id — Değerlendirme güncelleme ────────
  fastify.put<{
    Params: { id: string };
    Body: { title?: string; description?: string; status?: string; startsAt?: string; endsAt?: string };
  }>("/:id", async (request, reply) => {
    try {
      const orgId = request.user.orgId!;
      const existing = await prisma.assessment.findFirst({
        where: { id: request.params.id, organizationId: orgId },
      });

      if (!existing) {
        return reply.status(404).send({
          code: "NOT_FOUND",
          message: "Değerlendirme bulunamadı",
          traceId: request.traceId,
        });
      }

      const { title, description, status, startsAt, endsAt } = request.body;
      const assessment = await prisma.assessment.update({
        where: { id: request.params.id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(status !== undefined && { status: status as never }),
          ...(startsAt !== undefined && { startsAt: new Date(startsAt) }),
          ...(endsAt !== undefined && { endsAt: new Date(endsAt) }),
        },
      });

      return reply.send({ data: assessment });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Değerlendirme güncellenirken hata oluştu",
        traceId: request.traceId,
      });
    }
  });

  // ── DELETE /:id — Sadece DRAFT silinebilir ─────
  fastify.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    try {
      const orgId = request.user.orgId!;
      const existing = await prisma.assessment.findFirst({
        where: { id: request.params.id, organizationId: orgId },
      });

      if (!existing) {
        return reply.status(404).send({
          code: "NOT_FOUND",
          message: "Değerlendirme bulunamadı",
          traceId: request.traceId,
        });
      }

      if (existing.status !== "DRAFT") {
        return reply.status(409).send({
          code: "CONFLICT",
          message: "Yalnızca taslak durumundaki değerlendirmeler silinebilir",
          traceId: request.traceId,
        });
      }

      await prisma.assessment.delete({ where: { id: request.params.id } });
      return reply.send({ data: { ok: true } });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Değerlendirme silinirken hata oluştu",
        traceId: request.traceId,
      });
    }
  });

  // ── POST /:id/activate — Aktif hale getir ─────
  fastify.post<{ Params: { id: string } }>("/:id/activate", async (request, reply) => {
    try {
      const orgId = request.user.orgId!;
      const existing = await prisma.assessment.findFirst({
        where: { id: request.params.id, organizationId: orgId },
      });

      if (!existing) {
        return reply.status(404).send({
          code: "NOT_FOUND",
          message: "Değerlendirme bulunamadı",
          traceId: request.traceId,
        });
      }

      const assessment = await prisma.assessment.update({
        where: { id: request.params.id },
        data: { status: "ACTIVE" },
      });

      return reply.send({ data: assessment });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Değerlendirme etkinleştirilirken hata oluştu",
        traceId: request.traceId,
      });
    }
  });

  // ── POST /:id/assign — Personele atama ────────
  fastify.post<{
    Params: { id: string };
    Body: { personnelIds: string[]; dueAt?: string };
  }>("/:id/assign", async (request, reply) => {
    try {
      const orgId = request.user.orgId!;
      const { personnelIds, dueAt } = request.body;

      const existing = await prisma.assessment.findFirst({
        where: { id: request.params.id, organizationId: orgId },
      });

      if (!existing) {
        return reply.status(404).send({
          code: "NOT_FOUND",
          message: "Değerlendirme bulunamadı",
          traceId: request.traceId,
        });
      }

      const existingSessions = await prisma.assessmentSession.findMany({
        where: { assessmentId: existing.id, personnelId: { in: personnelIds } },
        select: { personnelId: true },
      });

      const alreadyAssigned = new Set(existingSessions.map((s) => s.personnelId));
      const toCreate = personnelIds.filter((pid) => !alreadyAssigned.has(pid));

      if (toCreate.length > 0) {
        await prisma.assessmentSession.createMany({
          data: toCreate.map((personnelId) => ({
            assessmentId: existing.id,
            personnelId,
            dueAt: dueAt ? new Date(dueAt) : undefined,
          })),
        });
      }

      return reply.status(201).send({
        data: { createdCount: toCreate.length, skippedCount: alreadyAssigned.size },
      });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Atama yapılırken hata oluştu",
        traceId: request.traceId,
      });
    }
  });

  // ── GET /:id/sessions — Oturum listesi ─────────
  fastify.get<{
    Params: { id: string };
    Querystring: { status?: string; page?: string; pageSize?: string };
  }>("/:id/sessions", async (request, reply) => {
    try {
      const orgId = request.user.orgId!;
      const { status } = request.query;
      const { page, pageSize, skip } = paginate(request.query);

      const assessment = await prisma.assessment.findFirst({
        where: { id: request.params.id, organizationId: orgId },
        select: { id: true },
      });

      if (!assessment) {
        return reply.status(404).send({
          code: "NOT_FOUND",
          message: "Değerlendirme bulunamadı",
          traceId: request.traceId,
        });
      }

      const where: Record<string, unknown> = { assessmentId: assessment.id };
      if (status) where.status = status;

      const [sessions, total] = await Promise.all([
        prisma.assessmentSession.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            personnel: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
                department: { select: { id: true, name: true } },
              },
            },
          },
        }),
        prisma.assessmentSession.count({ where }),
      ]);

      const data = sessions.map((s) => ({
        id: s.id,
        status: s.status,
        startedAt: s.startedAt,
        completedAt: s.completedAt,
        durationSec: s.durationSec,
        dimensionScores: s.dimensionScores,
        analysisPipeline: s.analysisPipeline,
        requiresHrReview: s.requiresHrReview,
        personnel: s.personnel,
      }));

      return reply.send({ data, meta: { total, page, pageSize } });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Oturumlar alınırken hata oluştu",
        traceId: request.traceId,
      });
    }
  });
};

export default assessmentRoutes;
