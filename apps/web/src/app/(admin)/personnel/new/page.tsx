"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPersonnelSchema, type CreatePersonnelInput } from "@ph/shared";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { GlassCard } from "@ph/ui";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import {
  useCreatePersonnel,
  useDepartmentList,
  useTeamsByDepartment,
} from "@/hooks/use-api";

const SHIFT_OPTIONS = [
  { value: "NONE", label: "Yok" },
  { value: "MORNING", label: "Sabah" },
  { value: "AFTERNOON", label: "Öğleden Sonra" },
  { value: "NIGHT", label: "Gece" },
  { value: "ROTATING", label: "Dönüşümlü" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "INACTIVE", label: "Pasif" },
  { value: "ON_LEAVE", label: "İzinli" },
];

const LANG_OPTIONS = [
  { value: "tr", label: "Türkçe" },
  { value: "en", label: "English" },
];

const inputClass =
  "w-full h-10 px-3 rounded-xl bg-muted/40 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors";

const labelClass = "block text-sm font-medium text-foreground mb-1.5";

const errorClass = "text-xs text-destructive mt-1";

function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}

export default function NewPersonnelPage() {
  const router = useRouter();
  const createMutation = useCreatePersonnel();
  const { data: departments, isLoading: depsLoading } = useDepartmentList();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreatePersonnelInput>({
    resolver: zodResolver(createPersonnelSchema),
    defaultValues: {
      status: "ACTIVE",
      shift: "NONE",
      preferredLanguage: "tr",
      experienceYear: 0,
    },
  });

  const selectedDepartmentId = watch("departmentId");
  const { data: teams } = useTeamsByDepartment(selectedDepartmentId);

  const onSubmit = async (data: CreatePersonnelInput) => {
    try {
      await createMutation.mutateAsync(data);
      toast.success("Personel başarıyla oluşturuldu");
      router.push("/personnel");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Personel oluşturulurken hata oluştu"
      );
    }
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        className="flex items-center gap-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href="/personnel"
          className="h-9 w-9 rounded-xl bg-muted/40 flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Yeni Personel</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Yeni personel kaydı oluşturun
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <GlassCard hover={false}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Kişisel Bilgiler */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                Kişisel Bilgiler
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Sicil Numarası"
                  error={errors.employeeId?.message}
                  required
                >
                  <input
                    {...register("employeeId")}
                    placeholder="Ör: PRS-001"
                    className={inputClass}
                  />
                </FormField>

                <FormField
                  label="Ad"
                  error={errors.firstName?.message}
                  required
                >
                  <input
                    {...register("firstName")}
                    placeholder="Ad"
                    className={inputClass}
                  />
                </FormField>

                <FormField
                  label="Soyad"
                  error={errors.lastName?.message}
                  required
                >
                  <input
                    {...register("lastName")}
                    placeholder="Soyad"
                    className={inputClass}
                  />
                </FormField>

                <FormField
                  label="E-posta"
                  error={errors.email?.message}
                  required
                >
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="ornek@firma.com"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Telefon" error={errors.phone?.message}>
                  <input
                    {...register("phone")}
                    placeholder="+90 5XX XXX XX XX"
                    className={inputClass}
                  />
                </FormField>

                <FormField
                  label="Doğum Tarihi"
                  error={errors.birthDate?.message}
                >
                  <Controller
                    name="birthDate"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="Doğum tarihi ve saat"
                      />
                    )}
                  />
                </FormField>
              </div>
            </div>

            {/* İş Bilgileri */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                İş Bilgileri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Pozisyon"
                  error={errors.position?.message}
                  required
                >
                  <input
                    {...register("position")}
                    placeholder="Ör: CNC Operatörü"
                    className={inputClass}
                  />
                </FormField>

                <FormField
                  label="Deneyim (Yıl)"
                  error={errors.experienceYear?.message}
                >
                  <input
                    {...register("experienceYear", { valueAsNumber: true })}
                    type="number"
                    min={0}
                    placeholder="0"
                    className={inputClass}
                  />
                </FormField>

                <FormField
                  label="Departman"
                  error={errors.departmentId?.message}
                >
                  <select
                    {...register("departmentId")}
                    className={inputClass}
                    disabled={depsLoading}
                  >
                    <option value="">Departman seçin</option>
                    {departments?.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Takım" error={errors.teamId?.message}>
                  <select
                    {...register("teamId")}
                    className={inputClass}
                    disabled={!selectedDepartmentId}
                  >
                    <option value="">
                      {selectedDepartmentId
                        ? "Takım seçin"
                        : "Önce departman seçin"}
                    </option>
                    {teams?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Durum" error={errors.status?.message}>
                  <select {...register("status")} className={inputClass}>
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Vardiya" error={errors.shift?.message}>
                  <select {...register("shift")} className={inputClass}>
                    {SHIFT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Tercih Edilen Dil"
                  error={errors.preferredLanguage?.message}
                >
                  <select
                    {...register("preferredLanguage")}
                    className={inputClass}
                  >
                    {LANG_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="İşe Giriş Tarihi"
                  error={errors.hireDate?.message}
                >
                  <Controller
                    name="hireDate"
                    control={control}
                    render={({ field }) => (
                      <DateTimePicker
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        placeholder="İşe giriş tarihi ve saat"
                      />
                    )}
                  />
                </FormField>
              </div>
            </div>

            {/* Notlar */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                Ek Bilgiler
              </h3>
              <FormField label="Notlar" error={errors.notes?.message}>
                <textarea
                  {...register("notes")}
                  rows={3}
                  placeholder="Personel hakkında ek notlar..."
                  className={cn(inputClass, "h-auto py-2.5 resize-none")}
                />
              </FormField>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/20">
              <Link
                href="/personnel"
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
              >
                İptal
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || createMutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Kaydet
              </button>
            </div>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  );
}
