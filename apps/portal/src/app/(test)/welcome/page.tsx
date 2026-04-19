"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ClipboardList, Clock, MessageCircle, ArrowRight,
  Shield, Loader2, AlertCircle,
} from "lucide-react";
import { GlassCard } from "@ph/ui";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface ActiveSession {
  id: string;
  status: string;
  assessment?: {
    title: string;
    description?: string;
  };
  questionSetSnapshot?: { questions?: unknown[] };
  questionCount?: number;
  estimatedDuration?: number;
}

function getAuthHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("ph_portal_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function WelcomePage() {
  const router = useRouter();
  const [personnel, setPersonnel] = useState<{
    firstName: string;
    lastName: string;
  } | null>(null);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [noSession, setNoSession] = useState(false);
  const [starting, setStarting] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [aiConsentChecked, setAiConsentChecked] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("ph_personnel");
    if (!stored) {
      router.replace("/login");
      return;
    }
    setPersonnel(JSON.parse(stored));

    (async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/api/sessions/portal/sessions/active`,
          { headers: getAuthHeaders() },
        );
        const activeSession = data?.data ?? data;
        if (!activeSession || !activeSession.id) {
          setNoSession(true);
        } else {
          setSession(activeSession);
        }
      } catch {
        setNoSession(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const canStart = consentChecked && aiConsentChecked && !!session;

  const questionCount =
    session?.questionCount ??
    (session?.questionSetSnapshot as any)?.questions?.length ??
    15;
  const estimatedDuration = session?.estimatedDuration ?? Math.max(20, questionCount * 2);

  const handleStart = async () => {
    if (!canStart || !session) return;
    setStarting(true);
    try {
      await axios.post(
        `${API_BASE}/api/sessions/portal/sessions/${session.id}/start`,
        {},
        { headers: getAuthHeaders() },
      );
      sessionStorage.setItem("ph_session", JSON.stringify(session));
      router.push("/assessment");
    } catch {
      setStarting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, hsl(200 13% 5%) 0%, hsl(153 40% 10%) 60%, hsl(200 10% 8%) 100%)",
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-xl select-none">PH</span>
          </div>
        </div>

        <GlassCard className="rounded-2xl">
          {loading ? (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
            </div>
          ) : noSession ? (
            <div className="flex flex-col items-center py-8">
              <div className="h-14 w-14 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
                <AlertCircle className="h-7 w-7 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2 text-center">
                Aktif Değerlendirme Yok
              </h2>
              <p className="text-sm text-muted-foreground text-center leading-relaxed max-w-xs">
                Şu anda atanmış bir değerlendirmeniz bulunmuyor. Lütfen İK
                yöneticinizle iletişime geçin.
              </p>
            </div>
          ) : (
            <>
              {/* Greeting */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Merhaba,{" "}
                  <span className="text-primary">{personnel?.firstName ?? ""}!</span>
                </h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Seninle birlikte potansiyelini keşfetmek için
                  <br />
                  kısa bir konuşma yapacağız.
                </p>
              </div>

              {/* Assessment Title */}
              {session?.assessment?.title && (
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 mb-4 text-center">
                  <p className="text-sm font-semibold text-primary">
                    {session.assessment.title}
                  </p>
                  {session.assessment.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {session.assessment.description}
                    </p>
                  )}
                </div>
              )}

              {/* Info Cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  {
                    icon: ClipboardList,
                    label: `~${questionCount} Soru`,
                    sub: "toplam",
                  },
                  {
                    icon: Clock,
                    label: `${estimatedDuration} dk`,
                    sub: "tahmini süre",
                  },
                  { icon: MessageCircle, label: "Sohbet", sub: "tarzında" },
                ].map((info) => (
                  <div
                    key={info.label}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/40"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <info.icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-bold text-foreground">{info.label}</p>
                    <p className="text-[10px] text-muted-foreground">{info.sub}</p>
                  </div>
                ))}
              </div>

              {/* Motivation */}
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 mb-6">
                <p className="text-sm text-center text-muted-foreground italic leading-relaxed">
                  &ldquo;Bu, seni değerlendiren değil,{" "}
                  <span className="text-primary font-medium">
                    seninle birlikte keşfeden
                  </span>{" "}
                  bir konuşma.&rdquo;
                </p>
              </div>

              {/* KVKK Consent */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                  <input
                    type="checkbox"
                    id="consent-data"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30 flex-shrink-0 cursor-pointer"
                  />
                  <label
                    htmlFor="consent-data"
                    className="text-xs text-muted-foreground cursor-pointer leading-relaxed"
                  >
                    <span className="font-semibold text-foreground">
                      Kişisel Verilerin İşlenmesi:
                    </span>{" "}
                    6698 sayılı KVKK kapsamında kişisel verilerimin işlenmesine
                    ilişkin{" "}
                    <button className="text-primary underline underline-offset-2">
                      aydınlatma metnini
                    </button>{" "}
                    okudum ve onaylıyorum.
                  </label>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                  <input
                    type="checkbox"
                    id="consent-ai"
                    checked={aiConsentChecked}
                    onChange={(e) => setAiConsentChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30 flex-shrink-0 cursor-pointer"
                  />
                  <label
                    htmlFor="consent-ai"
                    className="text-xs text-muted-foreground cursor-pointer leading-relaxed"
                  >
                    <span className="font-semibold text-foreground">
                      AI Destekli Değerlendirme:
                    </span>{" "}
                    Cevaplarımın yapay zeka ile analiz edilmesine ve kariyer
                    raporumun oluşturulmasına açık rıza veriyorum.
                  </label>
                </div>
              </div>

              {/* Privacy note */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
                <Shield className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span>
                  Cevapların yalnızca İK ve yetkili yöneticilerinle paylaşılır.
                  Doğru ya da yanlış cevap yoktur.
                </span>
              </div>

              {/* Start Button */}
              <motion.button
                onClick={handleStart}
                disabled={!canStart || starting}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-base
                  hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
                whileHover={canStart ? { scale: 1.01 } : {}}
                whileTap={canStart ? { scale: 0.98 } : {}}
              >
                {starting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Başlatılıyor...
                  </>
                ) : (
                  <>
                    Başlayalım
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>

              {!canStart && !starting && (
                <p className="text-[11px] text-muted-foreground text-center mt-3">
                  Başlamak için lütfen iki onay kutucuğunu işaretleyin
                </p>
              )}
            </>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
