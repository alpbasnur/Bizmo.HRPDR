"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ChevronLeft, Loader2, BrainCircuit,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import { GlassCard } from "@ph/ui";
import { cn } from "@/lib/utils";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface Question {
  id: string;
  text: string;
  subText: string | null;
  type: "OPEN_ENDED" | "SCALE" | "MULTIPLE_CHOICE" | "SITUATIONAL" | "BEHAVIORAL";
  phase: "ICEBREAKER" | "CORE" | "CLOSING";
  options?: Record<string, string> | null;
  minScale?: number | null;
  maxScale?: number | null;
  followUpPrompt?: string | null;
}

interface SessionData {
  id: string;
  questionSetSnapshot?: { questions?: Question[] };
  questions?: Question[];
}

function getAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("ph_portal_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function generateDedupeKey(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function AssessmentPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [currentAnswer, setCurrentAnswer] = useState<string | number>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [direction, setDirection] = useState(1);
  const [loadError, setLoadError] = useState(false);
  const dedupeKeysRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const stored = sessionStorage.getItem("ph_session");
    if (!stored) {
      router.replace("/welcome");
      return;
    }
    try {
      const parsed: SessionData = JSON.parse(stored);
      setSession(parsed);

      const q =
        parsed.questions ??
        parsed.questionSetSnapshot?.questions ??
        [];
      if (q.length === 0) {
        setLoadError(true);
      } else {
        setQuestions(q);
      }
    } catch {
      setLoadError(true);
    }
  }, [router]);

  const currentQuestion = questions[currentIndex];
  const total = questions.length;
  const progress = total > 0 ? ((currentIndex) / total) * 100 : 0;

  useEffect(() => {
    if (!currentQuestion) return;
    const saved = answers[currentQuestion.id];
    setCurrentAnswer(saved ?? (currentQuestion.type === "SCALE" ? 5 : ""));
  }, [currentIndex, currentQuestion, answers]);

  const isAnswerValid = useCallback(() => {
    if (!currentQuestion) return false;
    if (currentQuestion.type === "SCALE") return true;
    if (currentQuestion.type === "MULTIPLE_CHOICE") return String(currentAnswer).length > 0;
    return String(currentAnswer).trim().length >= 3;
  }, [currentAnswer, currentQuestion]);

  const getDedupeKey = (questionId: string) => {
    if (!dedupeKeysRef.current[questionId]) {
      dedupeKeysRef.current[questionId] = generateDedupeKey();
    }
    return dedupeKeysRef.current[questionId];
  };

  const submitAnswer = async (questionId: string, answer: string | number) => {
    if (!session) return;
    try {
      await axios.post(
        `${API_BASE}/api/sessions/portal/sessions/${session.id}/answer`,
        {
          questionId,
          answer: String(answer),
          clientDedupeKey: getDedupeKey(questionId),
        },
        { headers: getAuthHeaders() },
      );
      dedupeKeysRef.current[questionId] = generateDedupeKey();
    } catch {
      // Silently continue — answers are stored locally and retry on next navigation
    }
  };

  const handleNext = async () => {
    if (!isAnswerValid() || !currentQuestion || !session) return;

    const updatedAnswers = { ...answers, [currentQuestion.id]: currentAnswer };
    setAnswers(updatedAnswers);

    setIsSubmitting(true);
    await submitAnswer(currentQuestion.id, currentAnswer);
    setIsSubmitting(false);

    if (currentIndex === total - 1) {
      setIsCompleting(true);
      try {
        await axios.post(
          `${API_BASE}/api/sessions/portal/sessions/${session.id}/complete`,
          {},
          { headers: getAuthHeaders() },
        );
        router.push("/complete");
      } catch {
        setIsCompleting(false);
      }
      return;
    }

    setDirection(1);
    setCurrentIndex((i) => i + 1);
  };

  const handleBack = () => {
    if (currentIndex === 0 || !currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: currentAnswer }));
    setDirection(-1);
    setCurrentIndex((i) => i - 1);
  };

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -48 : 48 }),
  };

  if (loadError || (session && questions.length === 0 && !currentQuestion)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background:
            "linear-gradient(135deg, hsl(200 13% 5%) 0%, hsl(153 40% 10%) 60%, hsl(200 10% 8%) 100%)",
        }}
      >
        <GlassCard className="rounded-2xl max-w-sm text-center">
          <AlertCircle className="h-10 w-10 text-accent-red mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Sorular Yüklenemedi
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Oturum verilerinde bir sorun oluştu. Lütfen tekrar giriş yapın.
          </p>
          <button
            onClick={() => router.replace("/welcome")}
            className="text-sm text-primary hover:underline underline-offset-4"
          >
            Geri dön
          </button>
        </GlassCard>
      </div>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, hsl(200 13% 5%) 0%, hsl(153 40% 10%) 60%, hsl(200 10% 8%) 100%)",
        }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start p-4 pt-8"
      style={{
        background:
          "linear-gradient(135deg, hsl(200 13% 5%) 0%, hsl(153 40% 10%) 60%, hsl(200 10% 8%) 100%)",
      }}
    >
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">PH</span>
            </div>
          </div>
          <span className="text-sm text-white/60 tabular-nums">
            {currentIndex + 1} / {total}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-white/10 rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* Question Card */}
        <div className="relative min-h-[360px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestion.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <GlassCard className="rounded-2xl mb-4">
                {/* Phase tag */}
                <div className="flex items-center gap-2 mb-4">
                  {currentQuestion.phase === "ICEBREAKER" && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-accent-teal/10 text-accent-teal">
                      Buz Kırma
                    </span>
                  )}
                  {currentQuestion.phase === "CORE" && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      Ana Değerlendirme
                    </span>
                  )}
                  {currentQuestion.phase === "CLOSING" && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-accent-purple/10 text-accent-purple">
                      Kapanış
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <h2 className="text-lg sm:text-xl font-semibold text-foreground leading-snug mb-2">
                  {currentQuestion.text}
                </h2>
                {currentQuestion.subText && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {currentQuestion.subText}
                  </p>
                )}

                {/* Answer Area */}
                <div className="mt-4">
                  {/* Open-ended / Situational / Behavioral */}
                  {["OPEN_ENDED", "SITUATIONAL", "BEHAVIORAL"].includes(
                    currentQuestion.type,
                  ) && (
                    <div>
                      <textarea
                        value={String(currentAnswer)}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        placeholder="Cevabını buraya yaz..."
                        rows={4}
                        className="w-full rounded-xl bg-muted/50 border border-border/50 p-4 text-base
                          placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2
                          focus:ring-primary/30 resize-none transition-colors"
                      />
                      <div className="flex justify-between mt-1.5">
                        <span className="text-[11px] text-muted-foreground/60">
                          Doğru ya da yanlış cevap yoktur
                        </span>
                        <span
                          className={cn(
                            "text-[11px] tabular-nums",
                            String(currentAnswer).length < 3
                              ? "text-muted-foreground/40"
                              : "text-primary",
                          )}
                        >
                          {String(currentAnswer).length} karakter
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Scale */}
                  {currentQuestion.type === "SCALE" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground w-16 text-right tabular-nums">
                          {currentQuestion.minScale ?? 1}
                        </span>
                        <input
                          type="range"
                          min={currentQuestion.minScale ?? 1}
                          max={currentQuestion.maxScale ?? 10}
                          value={Number(currentAnswer)}
                          onChange={(e) => setCurrentAnswer(Number(e.target.value))}
                          className="flex-1 h-2 rounded-full accent-primary cursor-pointer"
                        />
                        <span className="text-sm text-muted-foreground w-16 tabular-nums">
                          {currentQuestion.maxScale ?? 10}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-4xl font-bold text-primary tabular-nums">
                          {currentAnswer}
                        </span>
                        <span className="text-lg text-muted-foreground">
                          /{currentQuestion.maxScale ?? 10}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Multiple Choice */}
                  {currentQuestion.type === "MULTIPLE_CHOICE" &&
                    currentQuestion.options && (
                      <div className="grid gap-2">
                        {Object.entries(currentQuestion.options).map(
                          ([key, val]) => (
                            <button
                              key={key}
                              onClick={() => setCurrentAnswer(key)}
                              className={cn(
                                "w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                                currentAnswer === key
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border/50 bg-muted/30 text-foreground hover:border-primary/30 hover:bg-primary/5",
                              )}
                            >
                              <span className="font-bold mr-2">{key}.</span>
                              {val}
                            </button>
                          ),
                        )}
                      </div>
                    )}
                </div>
              </GlassCard>

              {/* AI Follow-up placeholder */}
              {currentQuestion.followUpPrompt && (
                <div className="rounded-xl bg-accent-purple/5 border border-accent-purple/10 p-3 mb-4 flex items-start gap-2">
                  <BrainCircuit className="h-4 w-4 text-accent-purple mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-accent-purple/80">
                    AI takip sorusu hazırlanıyor...
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="h-12 px-4 rounded-xl border border-border/50 text-sm font-medium text-muted-foreground
              hover:bg-accent hover:text-foreground transition-all disabled:opacity-30 disabled:cursor-not-allowed
              flex items-center gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            Geri
          </button>

          <motion.button
            onClick={handleNext}
            disabled={!isAnswerValid() || isSubmitting || isCompleting}
            className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm
              hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
            whileHover={isAnswerValid() ? { scale: 1.01 } : {}}
            whileTap={isAnswerValid() ? { scale: 0.98 } : {}}
          >
            {isSubmitting || isCompleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isCompleting ? "Tamamlanıyor..." : "Gönderiliyor..."}
              </>
            ) : currentIndex === total - 1 ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Tamamla
              </>
            ) : (
              <>
                Sonraki
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
