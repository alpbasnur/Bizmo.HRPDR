"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@ph/ui";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { useCreateAssessment, useQuestionSetList } from "@/hooks/use-api";

const schema = z
  .object({
    title: z
      .string()
      .min(2, "Başlık en az 2 karakter olmalı")
      .max(200, "Başlık çok uzun"),
    description: z.string().max(2000).optional(),
    questionSetId: z.string().min(1, "Soru seti seçilmelidir"),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
  })
  .refine(
    (d) => {
      if (d.startsAt && d.endsAt) return new Date(d.endsAt) > new Date(d.startsAt);
      return true;
    },
    { message: "Bitiş tarihi başlangıçtan sonra olmalı", path: ["endsAt"] },
  );

type FormValues = z.infer<typeof schema>;

export default function NewAssessmentPage() {
  const router = useRouter();
  const createMutation = useCreateAssessment();
  const { data: qsData, isLoading: qsLoading } = useQuestionSetList();
  const questionSets = qsData ?? [];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      questionSetId: "",
      startsAt: "",
      endsAt: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await createMutation.mutateAsync({
        title: values.title,
        description: values.description || undefined,
        questionSetId: values.questionSetId,
        startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : undefined,
        endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : undefined,
      });
      toast.success("Değerlendirme oluşturuldu");
      router.push("/assessments");
    } catch {
      toast.error("Bir hata oluştu, lütfen tekrar deneyin");
    }
  };

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border/40 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Geri
        </button>
        <h1 className="text-2xl font-bold text-foreground">
          Yeni Değerlendirme
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Değerlendirme bilgilerini girerek oluşturun
        </p>
      </motion.div>

      <GlassCard hover={false}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Başlık <span className="text-destructive">*</span>
            </label>
            <input
              {...register("title")}
              placeholder="Değerlendirme başlığı"
              className={cn(inputCls, errors.title && "border-destructive/50")}
            />
            {errors.title && (
              <p className="text-xs text-destructive mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Açıklama
            </label>
            <textarea
              {...register("description")}
              rows={3}
              placeholder="Opsiyonel açıklama"
              className={cn(inputCls, "resize-none")}
            />
          </div>

          {/* Question Set */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Soru Seti <span className="text-destructive">*</span>
            </label>
            <select
              {...register("questionSetId")}
              className={cn(
                inputCls,
                errors.questionSetId && "border-destructive/50",
              )}
              disabled={qsLoading}
            >
              <option value="">
                {qsLoading ? "Yükleniyor..." : "Soru seti seçin"}
              </option>
              {questionSets.map((qs: any) => (
                <option key={qs.id} value={qs.id}>
                  {qs.name} (v{qs.version})
                </option>
              ))}
            </select>
            {errors.questionSetId && (
              <p className="text-xs text-destructive mt-1">
                {errors.questionSetId.message}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Başlangıç Tarihi
              </label>
              <Controller
                name="startsAt"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Başlangıç seçin"
                  />
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Bitiş Tarihi
              </label>
              <Controller
                name="endsAt"
                control={control}
                render={({ field }) => (
                  <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Bitiş seçin"
                    error={Boolean(errors.endsAt)}
                  />
                )}
              />
              {errors.endsAt && (
                <p className="text-xs text-destructive mt-1">
                  {errors.endsAt.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/60 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.97]"
            >
              {(isSubmitting || createMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Oluştur
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
