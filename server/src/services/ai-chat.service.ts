import type { AiProvider, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { decrypt } from "../lib/crypto.js";
import { completeChatMulti, type LlmMessage } from "../lib/llm.js";

const MAX_PERSONNEL_IN_CONTEXT = 72;
const MAX_JSON_CHARS = 2800;

export const HR_ASSISTANT_SYSTEM = `Sen PotansiyelHaritası platformunda deneyimli bir İK danışmanısın.
Elindeki personel verilerini (değerlendirme boyut skorları, HR PDR analizi, terfi hazırlığı, SWOT, kariyer önerileri, psikolojik özetler) kullanarak yöneticilere stratejik personel kararlarında yardımcı olursun.

## Kurum verisi özeti
{context}

## Kurallar
- Yanıtları Türkçe ver.
- Her öneriyi mümkünse somut verilerle destekle (skor, boyut adı, terfi hazırlığı READY/DEVELOPING/NOT_READY).
- Birden fazla aday varsa karşılaştırmalı madde işaretli liste veya tablo benzeri düzen kullan.
- Veride olmayan kişileri uydurma; emin değilsen bunu belirt.
- Riskleri ve gelişim gereksinimlerini de yaz.
- Markdown kullanabilirsin (başlıklar, kalın, listeler).`;

function truncateForContext(val: unknown, max = MAX_JSON_CHARS): string {
  if (val === null || val === undefined) return "(yok)";
  const s = typeof val === "string" ? val : JSON.stringify(val, null, 0);
  if (s.length <= max) return s;
  return `${s.slice(0, max)}… [kesildi]`;
}

/** Soru metninde geçen departman adlarına göre filtre kimlikleri */
async function resolveDepartmentIdsFromQuestion(
  organizationId: string,
  question: string,
): Promise<{ ids: string[]; matchedNames: string[] }> {
  const deps = await prisma.department.findMany({
    where: { organizationId, deletedAt: null },
    select: { id: true, name: true },
  });

  const qNorm = question.trim().toLowerCase();
  const matched: typeof deps = [];

  for (const d of deps) {
    const nameLower = d.name.trim().toLowerCase();
    if (!nameLower) continue;
    if (qNorm.includes(nameLower)) {
      matched.push(d);
      continue;
    }
    const tokens = nameLower.split(/\s+/).filter((w) => w.length >= 3);
    for (const t of tokens) {
      if (qNorm.includes(t)) {
        matched.push(d);
        break;
      }
    }
  }

  const uniq = [...new Map(matched.map((d) => [d.id, d])).values()];
  return {
    ids: uniq.map((d) => d.id),
    matchedNames: uniq.map((d) => d.name),
  };
}

export async function buildHrContext(
  organizationId: string,
  userQuestion: string,
): Promise<{
  contextText: string;
  metadata: Record<string, unknown>;
}> {
  const { ids: departmentIds, matchedNames } =
    await resolveDepartmentIdsFromQuestion(organizationId, userQuestion);

  const personnelWhere: Prisma.PersonnelWhereInput = {
    organizationId,
    deletedAt: null,
    status: "ACTIVE",
  };

  if (departmentIds.length > 0) {
    personnelWhere.departmentId = { in: departmentIds };
  }

  const [departmentsOverview, personnel] = await Promise.all([
    prisma.department.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true,
        name: true,
        _count: { select: { personnel: { where: { deletedAt: null } } } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.personnel.findMany({
      where: personnelWhere,
      take: MAX_PERSONNEL_IN_CONTEXT,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        position: true,
        experienceYear: true,
        hireDate: true,
        department: { select: { name: true } },
        team: { select: { name: true } },
        assessmentSessions: {
          where: { status: "COMPLETED" },
          orderBy: { completedAt: "desc" },
          take: 1,
          select: {
            id: true,
            completedAt: true,
            dimensionScores: true,
            hrPdrAnalysis: true,
            psychologicalAnalysis: true,
            swotAnalysis: true,
            careerPaths: true,
            keyInsights: true,
            assessment: { select: { title: true } },
          },
        },
      },
    }),
  ]);

  let truncated = false;
  const totalMatching = await prisma.personnel.count({ where: personnelWhere });
  if (totalMatching > MAX_PERSONNEL_IN_CONTEXT) {
    truncated = true;
  }

  const deptLines = departmentsOverview
    .map((d) => `- ${d.name}: ${d._count.personnel} personel`)
    .join("\n");

  const blocks: string[] = [];
  blocks.push(`### Departman özeti\n${deptLines || "(departman yok)"}`);
  if (departmentIds.length > 0) {
    blocks.push(
      `### Soruya göre departman filtresi\nEşleşen: ${matchedNames.join(", ") || "(yok)"}`,
    );
  }
  blocks.push(`### Personel ve son tamamlanan oturum özeti (${personnel.length} kayıt gösteriliyor${truncated ? ", liste kesildi" : ""})`);

  for (const p of personnel) {
    const session = p.assessmentSessions[0];
    const name = `${p.firstName} ${p.lastName}`;
    const dept = p.department?.name ?? "(atanmamış)";
    const team = p.team?.name ?? "";
    let block = `---\n**${name}** (id: ${p.id})\n`;
    block += `- Sicil / pozisyon: ${p.employeeId} / ${p.position}\n`;
    block += `- Departman / ekip: ${dept}${team ? ` / ${team}` : ""}\n`;
    block += `- Deneyim (yıl): ${p.experienceYear}\n`;
    if (session) {
      block += `- Son oturum: ${session.assessment.title} (${session.completedAt?.toISOString().slice(0, 10) ?? "?"})\n`;
      block += `- Boyut skorları: ${truncateForContext(session.dimensionScores)}\n`;
      block += `- HR PDR özeti: ${truncateForContext(session.hrPdrAnalysis)}\n`;
      block += `- Psikolojik özet: ${truncateForContext(session.psychologicalAnalysis)}\n`;
      block += `- SWOT: ${truncateForContext(session.swotAnalysis)}\n`;
      block += `- Kariyer yolları: ${truncateForContext(session.careerPaths)}\n`;
      if (session.keyInsights) {
        block += `- Öne çıkan içgörü: ${truncateForContext(session.keyInsights, 1200)}\n`;
      }
    } else {
      block += `- Tamamlanmış değerlendirme oturumu yok (veya veri yok).\n`;
    }
    blocks.push(block);
  }

  const contextText = blocks.join("\n\n");

  return {
    contextText,
    metadata: {
      departmentFilterIds: departmentIds,
      matchedDepartmentNames: matchedNames,
      personnelIncluded: personnel.length,
      personnelTotalMatching: totalMatching,
      truncated,
    },
  };
}

export async function generateHrAssistantReply(params: {
  organizationId: string;
  /** system hariç; son mesaj kullanıcı olmalı */
  dialogue: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<{
  reply: string;
  metadata: Record<string, unknown>;
  aiProvider: AiProvider;
  modelName: string;
}> {
  const { organizationId, dialogue } = params;
  const last = dialogue[dialogue.length - 1];
  if (!last || last.role !== "user") {
    throw new Error("Sohbet sonu kullanıcı mesajı olmalıdır");
  }

  const aiConfig = await prisma.aiConfig.findFirst({
    where: { organizationId, isActive: true },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  if (!aiConfig) {
    throw new Error(
      "Aktif AI yapılandırması yok. AI Yapılandırması sayfasından bir sağlayıcı ekleyin.",
    );
  }

  const { contextText, metadata: ctxMeta } = await buildHrContext(
    organizationId,
    last.content,
  );

  const systemContent = HR_ASSISTANT_SYSTEM.replace("{context}", contextText);

  const messages: LlmMessage[] = [
    { role: "system", content: systemContent },
    ...dialogue.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  const apiKey =
    aiConfig.provider === "MOCK" ? "" : decrypt(aiConfig.encryptedApiKey);

  const reply = await completeChatMulti({
    provider: aiConfig.provider,
    apiKey,
    modelName: aiConfig.modelName,
    messages,
    responseFormat: "text",
  });

  return {
    reply,
    metadata: {
      ...ctxMeta,
      aiModel: aiConfig.modelName,
      aiProvider: aiConfig.provider,
    },
    aiProvider: aiConfig.provider,
    modelName: aiConfig.modelName,
  };
}
