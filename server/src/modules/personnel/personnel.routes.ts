import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const personnelStatusEnum = z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]);
const personnelShiftEnum = z.enum([
  "NONE",
  "MORNING",
  "AFTERNOON",
  "NIGHT",
  "ROTATING",
]);

const createSchema = z.object({
  employeeId: z.string().min(1).max(50),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(30).optional(),
  position: z.string().min(1).max(200),
  experienceYear: z.number().int().min(0).default(0),
  status: personnelStatusEnum.default("ACTIVE"),
  shift: personnelShiftEnum.default("NONE"),
  preferredLanguage: z.string().max(10).default("tr"),
  departmentId: z.string().optional(),
  teamId: z.string().optional(),
  hireDate: z.coerce.date().optional(),
  birthDate: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
  avatarUrl: z.string().url().max(500).optional(),
  portalPassword: z.string().min(6).max(128).optional(),
});

const updateSchema = createSchema.partial();

function parsePagination(query: { page?: string; pageSize?: string }) {
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const raw = parseInt(query.pageSize ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(Math.max(1, raw), MAX_PAGE_SIZE);
  return { page, pageSize, skip: (page - 1) * pageSize };
}

const personnelRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onRequest", fastify.authenticate);

  // GET /stats — personnel statistics (registered before parameterized routes)
  fastify.get("/stats", async (request, reply) => {
    const orgId = request.user.orgId!;

    try {
      const baseWhere = { organizationId: orgId, deletedAt: null };

      const [total, active, inactive, onLeave, byDepartmentRaw] =
        await Promise.all([
          prisma.personnel.count({ where: baseWhere }),
          prisma.personnel.count({
            where: { ...baseWhere, status: "ACTIVE" },
          }),
          prisma.personnel.count({
            where: { ...baseWhere, status: "INACTIVE" },
          }),
          prisma.personnel.count({
            where: { ...baseWhere, status: "ON_LEAVE" },
          }),
          prisma.personnel.groupBy({
            by: ["departmentId"],
            where: baseWhere,
            _count: { id: true },
          }),
        ]);

      const departmentIds = byDepartmentRaw
        .map((r) => r.departmentId)
        .filter(Boolean) as string[];

      const departments =
        departmentIds.length > 0
          ? await prisma.department.findMany({
              where: { id: { in: departmentIds } },
              select: { id: true, name: true },
            })
          : [];

      const deptMap = new Map(departments.map((d) => [d.id, d.name]));

      const byDepartment = byDepartmentRaw.map((r) => ({
        departmentId: r.departmentId,
        departmentName: r.departmentId ? deptMap.get(r.departmentId) ?? null : null,
        count: r._count.id,
      }));

      return reply.send({
        data: { total, active, inactive, onLeave, byDepartment },
      });
    } catch (err) {
      request.log.error(err, "personnel.stats failed");
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Personel istatistikleri alınırken hata oluştu",
        traceId: request.traceId,
      });
    }
  });

  // GET / — list personnel (paginated)
  fastify.get<{
    Querystring: {
      search?: string;
      departmentId?: string;
      teamId?: string;
      status?: string;
      page?: string;
      pageSize?: string;
    };
  }>("/", async (request, reply) => {
    const orgId = request.user.orgId!;
    const { search, departmentId, teamId, status } = request.query;
    const { page, pageSize, skip } = parsePagination(request.query);

    try {
      const where: Record<string, unknown> = {
        organizationId: orgId,
        deletedAt: null,
      };

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { employeeId: { contains: search, mode: "insensitive" } },
        ];
      }
      if (departmentId) where.departmentId = departmentId;
      if (teamId) where.teamId = teamId;
      if (status) where.status = status;

      const [data, total] = await Promise.all([
        prisma.personnel.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
          include: {
            department: { select: { id: true, name: true } },
            team: { select: { id: true, name: true } },
          },
        }),
        prisma.personnel.count({ where }),
      ]);

      return reply.send({
        data,
        meta: { total, page, pageSize },
      });
    } catch (err) {
      request.log.error(err, "personnel.list failed");
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Personel listesi alınırken hata oluştu",
        traceId: request.traceId,
      });
    }
  });

  // POST / — create personnel
  fastify.post("/", async (request, reply) => {
    const orgId = request.user.orgId!;

    try {
      const body = createSchema.parse(request.body);

      const { portalPassword, ...rest } = body;
      const portalPasswordHash = portalPassword
        ? await bcrypt.hash(portalPassword, 12)
        : undefined;

      const personnel = await prisma.personnel.create({
        data: {
          ...rest,
          organizationId: orgId,
          ...(portalPasswordHash && { portalPasswordHash }),
        },
      });

      return reply.status(201).send({ data: personnel });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({
          code: "VALIDATION_ERROR",
          message: err.errors.map((e) => e.message).join(", "),
          traceId: request.traceId,
        });
      }
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "P2002"
      ) {
        return reply.status(409).send({
          code: "DUPLICATE_ENTRY",
          message: "Bu sicil numarası veya e-posta adresi zaten kayıtlı",
          traceId: request.traceId,
        });
      }
      request.log.error(err, "personnel.create failed");
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Personel oluşturulurken hata oluştu",
        traceId: request.traceId,
      });
    }
  });

  // GET /:id — get personnel detail
  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const orgId = request.user.orgId!;
    const { id } = request.params;

    try {
      const personnel = await prisma.personnel.findFirst({
        where: { id, organizationId: orgId, deletedAt: null },
        include: {
          department: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
          assessmentSessions: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
              id: true,
              status: true,
              startedAt: true,
              completedAt: true,
              dimensionScores: true,
              assessment: { select: { id: true, title: true } },
            },
          },
        },
      });

      if (!personnel) {
        return reply.status(404).send({
          code: "NOT_FOUND",
          message: "Personel bulunamadı",
          traceId: request.traceId,
        });
      }

      return reply.send({ data: personnel });
    } catch (err) {
      request.log.error(err, "personnel.getById failed");
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Personel bilgisi alınırken hata oluştu",
        traceId: request.traceId,
      });
    }
  });

  // PUT /:id — update personnel
  fastify.put<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const orgId = request.user.orgId!;
    const { id } = request.params;

    try {
      const body = updateSchema.parse(request.body);

      const existing = await prisma.personnel.findFirst({
        where: { id, organizationId: orgId, deletedAt: null },
      });

      if (!existing) {
        return reply.status(404).send({
          code: "NOT_FOUND",
          message: "Personel bulunamadı",
          traceId: request.traceId,
        });
      }

      const { portalPassword, ...rest } = body;
      const portalPasswordHash = portalPassword
        ? await bcrypt.hash(portalPassword, 12)
        : undefined;

      const updated = await prisma.personnel.update({
        where: { id },
        data: {
          ...rest,
          ...(portalPasswordHash && { portalPasswordHash }),
        },
      });

      return reply.send({ data: updated });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return reply.status(400).send({
          code: "VALIDATION_ERROR",
          message: err.errors.map((e) => e.message).join(", "),
          traceId: request.traceId,
        });
      }
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "P2002"
      ) {
        return reply.status(409).send({
          code: "DUPLICATE_ENTRY",
          message: "Bu sicil numarası veya e-posta adresi zaten kayıtlı",
          traceId: request.traceId,
        });
      }
      request.log.error(err, "personnel.update failed");
      return reply.status(500).send({
        code: "INTERNAL_ERROR",
        message: "Personel güncellenirken hata oluştu",
        traceId: request.traceId,
      });
    }
  });

  // DELETE /:id — soft delete
  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    async (request, reply) => {
      const orgId = request.user.orgId!;
      const { id } = request.params;

      try {
        const personnel = await prisma.personnel.findFirst({
          where: { id, organizationId: orgId, deletedAt: null },
        });

        if (!personnel) {
          return reply.status(404).send({
            code: "NOT_FOUND",
            message: "Personel bulunamadı",
            traceId: request.traceId,
          });
        }

        await prisma.personnel.update({
          where: { id },
          data: { deletedAt: new Date() },
        });

        return reply.send({ data: { ok: true } });
      } catch (err) {
        request.log.error(err, "personnel.delete failed");
        return reply.status(500).send({
          code: "INTERNAL_ERROR",
          message: "Personel silinirken hata oluştu",
          traceId: request.traceId,
        });
      }
    },
  );
};

export default personnelRoutes;
