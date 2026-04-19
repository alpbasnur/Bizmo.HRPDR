import { prisma } from "../lib/prisma.js";
import { decrypt } from "../lib/crypto.js";
import { completeChat } from "../lib/llm.js";

const DEFAULT_HR_PDR_PROMPT = `Sen deneyimli bir İnsan Kaynakları uzmanısın. Görevin, bir çalışanın performans değerlendirme oturumundaki cevaplarını analiz ederek kapsamlı bir HR PDR (Performans Değerlendirme Raporu) hazırlamaktır.

Analiz kapsamı:
1. **Performans Özeti**: Genel performans değerlendirmesi (1-10 arası puan ve açıklama)
2. **Yetkinlik Analizi**: Her boyut için (Mantıksal/Algoritmik, Liderlik, Sosyal Zeka, Gelişim Potansiyeli, Alan Uyumu) güçlü ve gelişime açık yönler
3. **Güçlü Yönler**: En az 3 güçlü yön
4. **Gelişim Alanları**: En az 3 gelişim alanı ve öneriler
5. **Hedef Önerileri**: Kısa vadeli (3 ay), orta vadeli (6 ay), uzun vadeli (1 yıl) hedef önerileri
6. **Genel Değerlendirme**: Terfi/yatay geçiş/eğitim önerileri

Çıktı YALNIZCA geçerli bir JSON nesnesi olmalı:
{
  "performanceScore": number,
  "performanceSummary": string,
  "competencyAnalysis": [{ "dimension": string, "score": number, "strengths": string[], "improvements": string[] }],
  "strengths": string[],
  "developmentAreas": [{ "area": string, "recommendation": string }],
  "goals": { "shortTerm": string[], "midTerm": string[], "longTerm": string[] },
  "overallRecommendation": string,
  "promotionReadiness": "READY" | "DEVELOPING" | "NOT_READY",
  "trainingNeeds": string[]
}`;

const DEFAULT_PSYCHOLOGICAL_PROMPT = `Sen deneyimli bir endüstriyel/örgütsel psikologsun. Görevin, bir çalışanın değerlendirme oturumundaki cevaplarını psikolojik açıdan analiz etmektir.

Analiz kapsamı:
1. **Kişilik Profili**: Big Five modeline göre kişilik özelliklerinin tahmini değerlendirmesi
2. **Duygusal Zeka**: Duygusal zeka boyutlarının analizi
3. **Stres & Başa Çıkma**: Stres yönetimi ve başa çıkma stratejileri
4. **Motivasyon Profili**: İçsel ve dışsal motivasyon kaynakları
5. **Ekip Dinamikleri**: Takım içi rol eğilimi ve işbirliği tarzı
6. **İletişim Tarzı**: Baskın iletişim tarzı ve etkinliği
7. **Karar Verme**: Karar verme tarzı ve risk eğilimi
8. **Psikolojik Dayanıklılık**: Psikolojik sağlamlık değerlendirmesi

Çıktı YALNIZCA geçerli bir JSON nesnesi olmalı:
{
  "personalityProfile": {
    "openness": { "score": number, "description": string },
    "conscientiousness": { "score": number, "description": string },
    "extraversion": { "score": number, "description": string },
    "agreeableness": { "score": number, "description": string },
    "neuroticism": { "score": number, "description": string }
  },
  "emotionalIntelligence": {
    "selfAwareness": number,
    "selfRegulation": number,
    "motivation": number,
    "empathy": number,
    "socialSkills": number,
    "summary": string
  },
  "stressManagement": { "level": "LOW" | "MODERATE" | "HIGH", "copingStrategies": string[], "recommendations": string[] },
  "motivationProfile": { "intrinsic": string[], "extrinsic": string[], "summary": string },
  "teamDynamics": { "role": string, "collaborationStyle": string, "strengths": string[], "challenges": string[] },
  "communicationStyle": { "primary": string, "effectiveness": number, "suggestions": string[] },
  "decisionMaking": { "style": string, "riskTolerance": "LOW" | "MODERATE" | "HIGH", "description": string },
  "resilience": { "score": number, "description": string, "recommendations": string[] },
  "overallPsychologicalProfile": string
}`;

export function extractJson(text: string): string {
  let t = text.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/m.exec(t);
  if (fence?.[1]) t = fence[1].trim();
  return t;
}

function formatAnswersForAi(answers: Array<{
  question: { text: string; dimension: string; type: string; phase: string } | null;
  textAnswer: string | null;
  scaleValue: number | null;
  choiceKey: string | null;
  followUpAnswer: string | null;
}>): string {
  return answers
    .filter((a) => a.question)
    .map((a, i) => {
      let answer = "";
      if (a.textAnswer) answer = a.textAnswer;
      else if (a.scaleValue !== null) answer = `Puan: ${a.scaleValue}/10`;
      else if (a.choiceKey) answer = `Seçim: ${a.choiceKey}`;
      else answer = "(Cevap verilmedi)";

      let followUp = "";
      if (a.followUpAnswer) followUp = `\n   Takip Cevabı: ${a.followUpAnswer}`;

      return `${i + 1}. [${a.question!.dimension}/${a.question!.type}] ${a.question!.text}\n   Cevap: ${answer}${followUp}`;
    })
    .join("\n\n");
}

export async function runSessionAnalysis(params: {
  sessionId: string;
  organizationId: string;
  analysisType: "HR_PDR_ANALYSIS" | "PSYCHOLOGICAL_ANALYSIS";
}): Promise<Record<string, unknown>> {
  const { sessionId, organizationId, analysisType } = params;

  const session = await prisma.assessmentSession.findFirst({
    where: { id: sessionId, assessment: { organizationId } },
    include: {
      personnel: {
        select: { firstName: true, lastName: true, position: true, experienceYear: true },
      },
      answers: {
        orderBy: { answeredAt: "asc" },
        include: {
          question: {
            select: { text: true, dimension: true, type: true, phase: true },
          },
        },
      },
      assessment: { select: { title: true } },
    },
  });

  if (!session) throw new Error("Oturum bulunamadı");
  if (session.answers.length === 0) throw new Error("Bu oturumda henüz cevap yok");

  const aiConfig = await prisma.aiConfig.findFirst({
    where: { organizationId, isActive: true },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  if (!aiConfig) {
    throw new Error("Aktif AI yapılandırması yok. AI Yapılandırması sayfasından bir sağlayıcı ekleyin.");
  }

  const promptTemplate = await prisma.aiPromptTemplate.findFirst({
    where: { organizationId, type: analysisType, isActive: true },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  const systemPrompt = promptTemplate?.systemPrompt ??
    (analysisType === "HR_PDR_ANALYSIS" ? DEFAULT_HR_PDR_PROMPT : DEFAULT_PSYCHOLOGICAL_PROMPT);

  const apiKey = aiConfig.provider === "MOCK" ? "" : decrypt(aiConfig.encryptedApiKey);

  const personnelInfo = `Personel: ${session.personnel.firstName} ${session.personnel.lastName}
Pozisyon: ${session.personnel.position}
Deneyim: ${session.personnel.experienceYear} yıl
Değerlendirme: ${session.assessment.title}`;

  const answersFormatted = formatAnswersForAi(session.answers);

  const userMessage = `${personnelInfo}\n\n--- CEVAPLAR ---\n\n${answersFormatted}`;

  if (aiConfig.provider === "MOCK") {
    const mockResult = analysisType === "HR_PDR_ANALYSIS"
      ? generateMockHrPdr(session.personnel)
      : generateMockPsychological(session.personnel);

    const field = analysisType === "HR_PDR_ANALYSIS" ? "hrPdrAnalysis" : "psychologicalAnalysis";
    await prisma.assessmentSession.update({
      where: { id: sessionId },
      data: { [field]: mockResult as any },
    });

    return mockResult;
  }

  const raw = await completeChat({
    provider: aiConfig.provider,
    apiKey,
    modelName: aiConfig.modelName,
    system: systemPrompt,
    user: userMessage,
  });

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(extractJson(raw));
  } catch {
    throw new Error("AI yanıtı geçerli JSON değil");
  }

  const field = analysisType === "HR_PDR_ANALYSIS" ? "hrPdrAnalysis" : "psychologicalAnalysis";
  await prisma.assessmentSession.update({
    where: { id: sessionId },
    data: { [field]: parsed as any },
  });

  await prisma.aiUsageLog.create({
    data: {
      provider: aiConfig.provider,
      modelName: aiConfig.modelName,
      purpose: analysisType,
      requestType: "session_analysis",
      status: "SUCCESS",
      sessionId,
    },
  });

  return parsed;
}

function generateMockHrPdr(personnel: { firstName: string; lastName: string }) {
  return {
    performanceScore: 7.5,
    performanceSummary: `${personnel.firstName} ${personnel.lastName} genel olarak iyi bir performans göstermektedir. (MOCK analiz)`,
    competencyAnalysis: [
      { dimension: "LOGICAL_ALGORITHMIC", score: 7, strengths: ["Analitik düşünme"], improvements: ["Karmaşık problem çözme"] },
      { dimension: "LEADERSHIP", score: 8, strengths: ["Takım motivasyonu"], improvements: ["Stratejik planlama"] },
    ],
    strengths: ["İletişim becerileri", "Takım çalışması", "Öğrenme istekliliği"],
    developmentAreas: [
      { area: "Teknik beceriler", recommendation: "İleri düzey eğitimler önerilir" },
      { area: "Zaman yönetimi", recommendation: "Önceliklendirme teknikleri geliştirilmeli" },
    ],
    goals: {
      shortTerm: ["Mevcut projeleri zamanında tamamlama"],
      midTerm: ["Liderlik eğitimi programına katılma"],
      longTerm: ["Kıdemli pozisyona hazırlanma"],
    },
    overallRecommendation: "Gelişim potansiyeli yüksek, eğitim desteklenmeli. (MOCK — gerçek analiz için AI sağlayıcısı yapılandırın)",
    promotionReadiness: "DEVELOPING",
    trainingNeeds: ["Liderlik geliştirme", "Stratejik düşünme"],
  };
}

function generateMockPsychological(personnel: { firstName: string; lastName: string }) {
  return {
    personalityProfile: {
      openness: { score: 7, description: "Yeni deneyimlere açık" },
      conscientiousness: { score: 8, description: "Düzenli ve sorumluluk sahibi" },
      extraversion: { score: 6, description: "Dengeli sosyal etkileşim" },
      agreeableness: { score: 7, description: "İşbirlikçi yaklaşım" },
      neuroticism: { score: 4, description: "Duygusal olarak kararlı" },
    },
    emotionalIntelligence: {
      selfAwareness: 7, selfRegulation: 7, motivation: 8, empathy: 7, socialSkills: 7,
      summary: `${personnel.firstName} ${personnel.lastName} ortalama üstü duygusal zekaya sahiptir. (MOCK)`,
    },
    stressManagement: { level: "MODERATE", copingStrategies: ["Problem odaklı başa çıkma"], recommendations: ["Mindfulness pratikleri"] },
    motivationProfile: { intrinsic: ["Öğrenme", "Başarı"], extrinsic: ["Kariyer gelişimi"], summary: "İçsel motivasyon baskın" },
    teamDynamics: { role: "Koordinatör", collaborationStyle: "Katılımcı", strengths: ["İletişim"], challenges: ["Delegasyon"] },
    communicationStyle: { primary: "Diplomatik", effectiveness: 7, suggestions: ["Daha doğrudan geri bildirim"] },
    decisionMaking: { style: "Analitik", riskTolerance: "MODERATE", description: "Veri odaklı karar verme" },
    resilience: { score: 7, description: "İyi psikolojik dayanıklılık", recommendations: ["Stres yönetimi eğitimi"] },
    overallPsychologicalProfile: "Dengeli kişilik profili, gelişim potansiyeli mevcut. (MOCK — gerçek analiz için AI sağlayıcısı yapılandırın)",
  };
}

export { DEFAULT_HR_PDR_PROMPT, DEFAULT_PSYCHOLOGICAL_PROMPT };
