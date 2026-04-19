"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, BrainCircuit, Cog, Target, BarChart3, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@ph/shared";
import { api, setAccessToken } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/login", data);
      const { accessToken, user } = res.data.data;
      setAccessToken(accessToken);
      setAuth(user, accessToken);
      toast.success(`Hoş geldiniz, ${user.name}!`);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Giriş başarısız. Bilgilerinizi kontrol edin.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: BrainCircuit,
      title: "AI Destekli Analiz",
      desc: "Claude, GPT ve Gemini ile derin potansiyel değerlendirmesi",
    },
    {
      icon: Target,
      title: "5 Boyutlu Ölçüm",
      desc: "Mantıksal düşünce, liderlik, sosyal zeka ve kariyer uyumu",
    },
    {
      icon: BarChart3,
      title: "Gerçek Zamanlı Analitik",
      desc: "Departman ve takım bazlı karşılaştırmalı raporlar",
    },
    {
      icon: Cog,
      title: "CNC & Üretim Odaklı",
      desc: "Talaşlı imalat sektörüne özel değerlendirme sistemi",
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Sol Panel (60%) ── */}
      <motion.div
        className="hidden lg:flex flex-col justify-between w-[60%] relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, hsl(200 13% 5%) 0%, hsl(153 40% 12%) 50%, hsl(200 13% 8%) 100%)",
        }}
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Dekoratif daireler */}
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-150px] left-[-80px] w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl pointer-events-none" />

        {/* Üst: Logo + marka */}
        <div className="relative z-10 p-10">
          <div className="flex items-center gap-3 mb-12">
            <div
              className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(153 60% 43%)" }}
            >
              <span className="text-white font-bold text-lg select-none">PH</span>
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">
                PotansiyelHaritası
              </p>
              <p className="text-white/50 text-xs">v1.1 · Yönetim Paneli</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Personelin gizli{" "}
              <span style={{ color: "hsl(153 60% 53%)" }}>potansiyelini</span>
              <br />
              keşfedin
            </h1>
            <p className="text-white/60 text-base max-w-md leading-relaxed">
              AI destekli değerlendirme sistemi ile mavi yaka personelinin
              liderlik kapasitesini, kariyer yönelimini ve büyüme potansiyelini
              objektif olarak ölçün.
            </p>
          </motion.div>
        </div>

        {/* Orta: Özellikler */}
        <div className="relative z-10 px-10 py-6">
          <div className="grid grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="glass-surface rounded-xl p-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.35 + i * 0.08,
                  duration: 0.4,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center mb-2">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-white font-semibold text-sm mb-1">
                  {f.title}
                </p>
                <p className="text-white/50 text-[11px] leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Alt */}
        <div className="relative z-10 p-10">
          <p className="text-white/30 text-xs">
            © 2026 PotansiyelHaritası · Tüm hakları saklıdır
          </p>
        </div>
      </motion.div>

      {/* ── Sağ Panel (40%) ── */}
      <motion.div
        className="flex flex-col justify-center flex-1 lg:w-[40%] bg-background px-6 sm:px-10 lg:px-12 overflow-y-auto"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="w-full max-w-sm mx-auto">
          {/* Mobil logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">PH</span>
            </div>
            <span className="font-bold text-sm text-foreground">
              PotansiyelHaritası
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-1">
              Hoş Geldiniz
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              Yönetim paneline giriş yapın
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* E-posta */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  E-posta
                </label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="admin@example.com"
                  className={cn(
                    "form-input-base px-3.5",
                    errors.email && "border-destructive focus:ring-destructive/30"
                  )}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="flex items-center gap-1 text-xs text-destructive mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Şifre */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Şifre
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={cn(
                      "form-input-base px-3.5 pr-11",
                      errors.password &&
                        "border-destructive focus:ring-destructive/30"
                    )}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="flex items-center gap-1 text-xs text-destructive mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Beni Hatırla + Şifremi Unuttum */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    {...register("rememberMe")}
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30 cursor-pointer"
                  />
                  <span className="text-sm text-muted-foreground">
                    Beni hatırla
                  </span>
                </label>
                <a
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline underline-offset-4 transition-colors"
                >
                  Şifremi unuttum
                </a>
              </div>

              {/* Giriş Butonu */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  "Giriş Yap"
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                Bu giriş ekranı yalnızca yöneticiler içindir.
                <br />
                Personel girişi için{" "}
                <a
                  href={
                    process.env["NEXT_PUBLIC_PORTAL_URL"] ??
                    "http://localhost:3002"
                  }
                  className="text-primary hover:underline"
                >
                  personel portalını
                </a>{" "}
                kullanın.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
