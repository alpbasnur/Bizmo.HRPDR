-- AI sohbet / rapor sorgularında kullanılan oturum analiz sütunları (eski DB uyumu)
ALTER TABLE "AssessmentSession" ADD COLUMN IF NOT EXISTS "hrPdrAnalysis" JSONB;
ALTER TABLE "AssessmentSession" ADD COLUMN IF NOT EXISTS "psychologicalAnalysis" JSONB;
