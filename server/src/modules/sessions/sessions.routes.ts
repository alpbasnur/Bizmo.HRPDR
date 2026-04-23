import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { runSessionAnalysis } from "../../services/session-analysis.service.js";
import { isHttpError } from "../../lib/http-error.js";

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

// ═══════════════════════════════════════════
// Admin route'ları  (prefix: /api/sessions)
// ═══════════════════════════════════════════

export const sessionAdminRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", fastify.authenticate);

  // ── GET /:id — Oturum detayı ───────────────────
  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    try {
      const orgId = request.user.orgId!;

      const session = await prisma.assessmentSession.findFirst({
        where: {
          id: request.params.id,
          assessment: { organizationId: orgId },
        },
        include: {
          personnel: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
              email: true,
              position: true,
              department: { select: { id: true, name: true } },
            },
          },
          answers: {
            orderBy: { answeredAt: "asc" },
            include: {
              question: {
                select: { id: true, text: true, dimension: true, type: true, phase: true },
              },
            },
          },
          assessment: { select: { id: true, title: true } },
          analysisReview: true,
        },
      });

      if (!session) {
        return reply.status(404).send({
          code: "NOT_FOUND",
          message: "Oturum bulunamadı",
          traceId: request.traceId,
        });
      }

      return reply.send({
        data: {
          ...session,
          dimensionScores: session.dimensionScores,
          swotAnalysis: session.swotAnalysis,
          careerPaths: session.careerPaths,
          keyInsights: session.keyInsights,
          hrPdrAnalysis: session.hrPdrAnalysis,
          psychologicalAnalysis: session.psychologicalAnalysis,
        },
      });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Oturum detayı alınırken hata oluştu",
        traceId: request.traceId,
      });
    }
  });

  // ── GET /:id/events — Oturum olay zaman çizelgesi
  fastify.get<{ Params: { id: string } }>("/:id/events", async (request, reply) => {
    try {
      const orgId = request.user.orgId!;

      const session = await prisma.assessmentSession.findFirst({
        where: { id: request.params.id, assessment: { organizationId: orgId } },
        select: { id: true },
      });

      if (!session) {
        return reply.status(404).send({
          code: "NOT_FOUND",
          message: "Oturum bulunamadı",
          traceId: request.traceId,
        });
      }

      const events = await prisma.sessionEvent.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: "asc" },
      });

      return reply.send({ data: events });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Olay zaman çizelgesi alınırken hata oluştu",
        traceId: request.traceId,
      });
    }
  });

  // ── POST /:id/ai-analysis — AI analizi başlat (HR PDR veya Psikolojik)
  fastify.post<{
    Params: { id: string };
    Body: { analysisType: "HR_PDR_ANALYSIS" | "PSYCHOLOGICAL_ANALYSIS" };
  }>("/:id/ai-analysis", async (request, reply) => {
    try {
      const orgId = request.user.orgId!;
      const { analysisType } = request.body;

      if (!["HR_PDR_ANALYSIS", "PSYCHOLOGICAL_ANALYSIS"].includes(analysisType)) {
        return reply.status(400).send({
          code: "VALIDATION_ERROR",
          message: "Geçersiz analiz tipi. HR_PDR_ANALYSIS veya PSYCHOLOGICAL_ANALYSIS kullanın.",
          traceId: request.traceId,
        });
      }

      const session = await prisma.assessmentSession.findFirst({
        where: { id: request.params.id, assessment: { organizationId: orgId } },
        select: { id: true },
      });

      if (!session) {
        return reply.status(404).send({
          code: "NOT_FOUND",
          message: "Oturum bulunamadı",
          traceId: request.traceId,
        });
      }

      const result = await runSessionAnalysis({
        sessionId: session.id,
        organizationId: orgId,
        analysisType,
      });

      return reply.send({ data: result });
    } catch (err) {
      if (isHttpError(err)) {
        return reply.status(err.statusCode).send({
          code: err.code ?? "REQUEST_ERROR",
          message: err.message,
          traceId: request.traceId,
        });
      }
      const message = err instanceof Error ? err.message : "AI analizi sırasında hata oluştu";
      request.log.error(err);
      return reply.status(500).send({
        code: "AI_ANALYSIS_ERROR",
        message,
        traceId: request.traceId,
      });
    }
  });

  // ── POST /:id/review — Analiz incelemesi oluştur/güncelle
  fastify.post<{
    Params: { id: string };
    Body: { status: "PENDING" | "APPROVED" | "REJECTED"; comment?: string };
  }>("/:id/review", async (request, reply) => {
    try {
      const orgId = request.user.orgId!;
      const { status, comment } = request.body;

      const session = await prisma.assessmentSession.findFirst({
        where: { id: request.params.id, assessment: { organizationId: orgId } },
        select: { id: true },
      });

      if (!session) {
        return reply.status(404).send({
          code: "NOT_FOUND",
          message: "Oturum bulunamadı",
          traceId: request.traceId,
        });
      }

      const review = await prisma.analysisReview.upsert({
        where: { sessionId: session.id },
        create: {
          sessionId: session.id,
          reviewerId: request.user.sub,
          status,
          comment,
          decidedAt: status !== "PENDING" ? new Date() : undefined,
        },
        update: {
          reviewerId: request.user.sub,
          status,
          comment,
          decidedAt: status !== "PENDING" ? new Date() : undefined,
        },
      });

      return reply.send({ data: review });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "İnceleme kaydedilirken hata oluştu",
        traceId: request.traceId,
      });
    }
  });
};

// ═══════════════════════════════════════════
// Portal route'ları
// ═══════════════════════════════════════════

export const sessionPortalRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", fastify.authenticatePortal);

  // ── GET /portal/sessions/active — Aktif oturum ─
  fastify.get("/portal/sessions/active", async (request, reply) => {
    try {
      const personnelId = request.user.sub;

      const session = await prisma.assessmentSession.findFirst({
        where: {
          personnelId,
          status: { in: ["NOT_STARTED", "IN_PROGRESS"] },
        },
        orderBy: { createdAt: "desc" },
        include: {
          assessment: {
            select: { id: true, title: true, description: true, questionSetId: true },
          },
        },
      });

      if (!session) {
        return reply.send({ data: null });
      }

      let questions: unknown;

      if (session.questionSetSnapshot) {
        questions = session.questionSetSnapshot;
      } else {
        const setItems = await prisma.questionSetItem.findMany({
          where: { questionSetId: session.assessment.questionSetId },
          orderBy: { order: "asc" },
          include: {
            question: {
              select: {
                id: true,
                text: true,
                subText: true,
                dimension: true,
                type: true,
                phase: true,
                options: true,
                minScale: true,
                maxScale: true,
                followUpPrompt: true,
              },
            },
          },
        });
        questions = setItems.map((item) => ({
          ...item.question,
          order: item.order,
          isRequired: item.isRequired,
          customWeight: item.customWeight,
        }));
      }

      return reply.send({
        data: {
          id: session.id,
          status: session.status,
          startedAt: session.startedAt,
          dueAt: session.dueAt,
          assessment: session.assessment,
          questions,
        },
      });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Aktif oturum alınırken hata oluştu",
        traceId: request.traceId,
      });
    }
  });

  // ── POST /portal/sessions/:id/start — Oturum başlat
  fastify.post<{ Params: { id: string } }>(
    "/portal/sessions/:id/start",
    async (request, reply) => {
      try {
        const personnelId = request.user.sub;

        const session = await prisma.assessmentSession.findFirst({
          where: { id: request.params.id, personnelId },
        });

        if (!session) {
          return reply.status(404).send({
            code: "NOT_FOUND",
            message: "Oturum bulunamadı",
            traceId: request.traceId,
          });
        }

        if (session.status !== "NOT_STARTED") {
          return reply.status(409).send({
            code: "CONFLICT",
            message: "Oturum zaten başlatılmış",
            traceId: request.traceId,
          });
        }

        const now = new Date();

        const [updated] = await prisma.$transaction([
          prisma.assessmentSession.update({
            where: { id: session.id },
            data: {
              status: "IN_PROGRESS",
              startedAt: now,
              ipAddress: request.ip,
              userAgent: request.headers["user-agent"] ?? null,
            },
          }),
          prisma.sessionEvent.create({
            data: {
              sessionId: session.id,
              type: "SESSION_STARTED",
              payload: { startedAt: now.toISOString() },
            },
          }),
          prisma.consentRecord.create({
            data: {
              personnelId,
              sessionId: session.id,
              consentType: "ASSESSMENT_CONSENT",
              legalTextVersion: "1.0",
              accepted: true,
              acceptedAt: now,
              ipAddress: request.ip,
              userAgent: request.headers["user-agent"] ?? null,
            },
          }),
          prisma.consentRecord.create({
            data: {
              personnelId,
              sessionId: session.id,
              consentType: "DATA_PROCESSING",
              legalTextVersion: "1.0",
              accepted: true,
              acceptedAt: now,
              ipAddress: request.ip,
              userAgent: request.headers["user-agent"] ?? null,
            },
          }),
        ]);

        return reply.send({ data: updated });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          code: "INTERNAL_ERROR",
          message: "Oturum başlatılırken hata oluştu",
          traceId: request.traceId,
        });
      }
    },
  );

  // ── POST /portal/sessions/:id/answer — Cevap kaydet
  fastify.post<{
    Params: { id: string };
    Body: {
      questionId: string;
      textAnswer?: string;
      scaleValue?: number;
      choiceKey?: string;
      durationSec?: number;
      followUpAsked?: boolean;
      followUpAnswer?: string;
      clientDedupeKey?: string;
    };
  }>("/portal/sessions/:id/answer", async (request, reply) => {
    try {
      const personnelId = request.user.sub;
      const { questionId, textAnswer, scaleValue, choiceKey, durationSec, followUpAsked, followUpAnswer, clientDedupeKey } = request.body;

      const session = await prisma.assessmentSession.findFirst({
        where: { id: request.params.id, personnelId, status: "IN_PROGRESS" },
        select: { id: true },
      });

      if (!session) {
        return reply.status(404).send({
          code: "NOT_FOUND",
          message: "Aktif oturum bulunamadı",
          traceId: request.traceId,
        });
      }

      const answerData = {
        textAnswer,
        scaleValue,
        choiceKey,
        durationSec,
        followUpAsked: followUpAsked ?? false,
        followUpAnswer,
        clientDedupeKey,
        answeredAt: new Date(),
      };

      let answer;

      if (clientDedupeKey) {
        answer = await prisma.answer.upsert({
          where: { sessionId_clientDedupeKey: { sessionId: session.id, clientDedupeKey } },
          create: { sessionId: session.id, questionId, ...answerData },
          update: answerData,
        });
      } else {
        answer = await prisma.answer.upsert({
          where: { sessionId_questionId: { sessionId: session.id, questionId } },
          create: { sessionId: session.id, questionId, ...answerData },
          update: answerData,
        });
      }

      await prisma.sessionEvent.create({
        data: {
          sessionId: session.id,
          type: "ANSWER_SAVED",
          payload: { questionId, answerId: answer.id },
        },
      });

      return reply.send({ data: answer });
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Cevap kaydedilirken hata oluştu",
        traceId: request.traceId,
      });
    }
  });

  // ── POST /portal/sessions/:id/complete — Oturumu tamamla
  fastify.post<{ Params: { id: string } }>(
    "/portal/sessions/:id/complete",
    async (request, reply) => {
      try {
        const personnelId = request.user.sub;

        const session = await prisma.assessmentSession.findFirst({
          where: { id: request.params.id, personnelId, status: "IN_PROGRESS" },
        });

        if (!session) {
          return reply.status(404).send({
            code: "NOT_FOUND",
            message: "Aktif oturum bulunamadı",
            traceId: request.traceId,
          });
        }

        const now = new Date();
        const durationSec = session.startedAt
          ? Math.round((now.getTime() - session.startedAt.getTime()) / 1000)
          : null;

        const [updated] = await prisma.$transaction([
          prisma.assessmentSession.update({
            where: { id: session.id },
            data: {
              status: "COMPLETED",
              completedAt: now,
              durationSec,
              analysisPipeline: "QUEUED",
            },
          }),
          prisma.sessionEvent.create({
            data: {
              sessionId: session.id,
              type: "SESSION_COMPLETED",
              payload: { completedAt: now.toISOString(), durationSec },
            },
          }),
        ]);

        return reply.send({ data: updated });
      } catch (err) {
        request.log.error(err);
        return reply.status(500).send({
          code: "INTERNAL_ERROR",
          message: "Oturum tamamlanırken hata oluştu",
          traceId: request.traceId,
        });
      }
    },
  );
};

export default sessionAdminRoutes;
