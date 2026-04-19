"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Pencil,
  Trash2,
  UserPlus,
  X,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Search,
  Eye,
  BrainCircuit,
  FileText,
  MessageSquare,
  TrendingUp,
  Heart,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { GlassCard, PortalModal } from "@ph/ui";
import { cn } from "@/lib/utils";
import { toDatetimeLocalString } from "@/lib/datetime-local";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import {
  useAssessment,
  useDeleteAssessment,
  useActivateAssessment,
  useAssignAssessment,
  useAssessmentSessions,
  usePersonnelList,
  useUpdateAssessment,
  useSession,
  useRunSessionAiAnalysis,
  type SessionDetail,
  type AnswerRow,
} from "@/hooks/use-api";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Taslak", className: "bg-muted text-muted-foreground" },
  ACTIVE: { label: "Aktif", className: "bg-accent-green/10 text-accent-green" },
  PAUSED: { label: "Duraklatıldı", className: "bg-amber-500/10 text-amber-500" },
  COMPLETED: { label: "Tamamlandı", className: "bg-sky-500/10 text-sky-500" },
  ARCHIVED: { label: "Arşiv", className: "bg-muted text-muted-foreground" },
};

const SESSION_STATUS: Record<string, { label: string; className: string }> = {
  NOT_STARTED: { label: "Başlamadı", className: "bg-muted text-muted-foreground" },
  IN_PROGRESS: { label: "Devam Ediyor", className: "bg-amber-500/10 text-amber-500" },
  PAUSED: { label: "Duraklatıldı", className: "bg-amber-500/10 text-amber-500" },
  COMPLETED: { label: "Tamamlandı", className: "bg-accent-green/10 text-accent-green" },
  EXPIRED: { label: "Süresi Doldu", className: "bg-destructive/10 text-destructive" },
};

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

const editSchema = z
  .object({
    title: z.string().min(2, "Başlık en az 2 karakter").max(200),
    description: z.string().max(2000).optional(),
    status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
  })
  .refine(
    (d) => {
      if (d.startsAt && d.endsAt)
        return new Date(d.endsAt) > new Date(d.startsAt);
      return true;
    },
    { message: "Bitiş tarihi başlangıçtan sonra olmalı", path: ["endsAt"] },
  );

type EditFormValues = z.infer<typeof editSchema>;

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const { data: assessment, isLoading } = useAssessment(id);

  const deleteMutation = useDeleteAssessment();
  const activateMutation = useActivateAssessment();
  const assignMutation = useAssignAssessment();
  const updateMutation = useUpdateAssessment();

  const [assignOpen, setAssignOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([]);
  const [personnelSearch, setPersonnelSearch] = useState("");
  const [sessionPage, setSessionPage] = useState(1);

  const { data: sessionsData, isLoading: sessionsLoading } =
    useAssessmentSessions(id, { page: sessionPage, pageSize: 10 });
  const sessions = sessionsData?.items ?? [];
  const sessionsMeta = {
    total: sessionsData?.total ?? 0,
    page: sessionsData?.page ?? 1,
    pageSize: sessionsData?.pageSize ?? 10,
  };
  const sessionTotalPages =
    Math.ceil(sessionsMeta.total / sessionsMeta.pageSize) || 1;

  const { data: personnelData } = usePersonnelList({
    search: personnelSearch || undefined,
    pageSize: 50,
  });
  const personnelList = personnelData?.items ?? [];

  const handleDelete = async () => {
    if (!confirm("Bu değerlendirmeyi silmek istediğinizden emin misiniz?"))
      return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Değerlendirme silindi");
      router.push("/assessments");
    } catch {
      toast.error("Silme işlemi başarısız");
    }
  };

  const handleActivate = async () => {
    try {
      await activateMutation.mutateAsync(id);
      toast.success("Değerlendirme aktifleştirildi");
    } catch {
      toast.error("Aktifleştirme başarısız");
    }
  };

  const handleAssign = async () => {
    if (selectedPersonnel.length === 0) return;
    try {
      await assignMutation.mutateAsync({
        id,
        data: { personnelIds: selectedPersonnel },
      });
      toast.success(`${selectedPersonnel.length} personel atandı`);
      setAssignOpen(false);
      setSelectedPersonnel([]);
    } catch {
      toast.error("Atama başarısız");
    }
  };

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEditForm,
    control: editControl,
    formState: { errors: editErrors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "DRAFT",
      startsAt: "",
      endsAt: "",
    },
  });

  useEffect(() => {
    if (searchParams.get("edit") === "true") {
      setEditOpen(true);
      router.replace(`/assessments/${id}`, { scroll: false });
    }
  }, [searchParams, router, id]);

  useEffect(() => {
    if (!assessment || !editOpen) return;
    resetEditForm({
      title: assessment.title,
      description: assessment.description ?? "",
      status: assessment.status as EditFormValues["status"],
      startsAt: assessment.startsAt
        ? toDatetimeLocalString(new Date(assessment.startsAt))
        : "",
      endsAt: assessment.endsAt
        ? toDatetimeLocalString(new Date(assessment.endsAt))
        : "",
    });
  }, [assessment, editOpen, resetEditForm]);

  const onEditSave = async (values: EditFormValues) => {
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          title: values.title,
          description: values.description?.trim() || undefined,
          status: values.status,
          ...(values.startsAt && {
            startsAt: new Date(values.startsAt).toISOString(),
          }),
          ...(values.endsAt && {
            endsAt: new Date(values.endsAt).toISOString(),
          }),
        },
      });
      toast.success("Değerlendirme güncellendi");
      setEditOpen(false);
    } catch {
      toast.error("Güncelleme başarısız");
    }
  };

  const togglePersonnel = (pid: string) => {
    setSelectedPersonnel((prev) =>
      prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid],
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 w-full">
        <div className="h-8 w-48 bg-muted/40 rounded-xl animate-pulse" />
        <div className="h-40 bg-muted/40 rounded-xl animate-pulse" />
        <div className="h-64 bg-muted/40 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-muted-foreground">
          Değerlendirme bulunamadı
        </p>
        <button
          onClick={() => router.push("/assessments")}
          className="mt-3 text-sm text-primary hover:underline"
        >
          Listeye dön
        </button>
      </div>
    );
  }

  const badge = STATUS_BADGE[assessment.status] ?? STATUS_BADGE.DRAFT ?? { label: "Taslak", className: "bg-muted text-muted-foreground" };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => router.push("/assessments")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Değerlendirmeler
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">
              {assessment.title}
            </h1>
            <span
              className={cn(
                "inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-semibold",
                badge.className,
              )}
            >
              {badge.label}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {assessment.status === "DRAFT" && (
              <button
                onClick={handleActivate}
                disabled={activateMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-green/10 text-accent-green text-sm font-medium hover:bg-accent-green/20 transition-colors disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" />
                Aktifleştir
              </button>
            )}
            <button
              onClick={() => setAssignOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Personel Ata
            </button>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/60 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              Düzenle
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Sil
            </button>
          </div>
        </div>
      </motion.div>

      {/* Info */}
      <GlassCard hover={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Soru Seti
            </p>
            <p className="text-sm font-semibold text-foreground">
              {assessment.questionSet?.name ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Başlangıç
            </p>
            <p className="text-sm text-foreground">
              {formatDate(assessment.startsAt)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Bitiş
            </p>
            <p className="text-sm text-foreground">
              {formatDate(assessment.endsAt)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-1">
              Oluşturulma
            </p>
            <p className="text-sm text-foreground">
              {formatDate(assessment.createdAt)}
            </p>
          </div>
        </div>
        {assessment.description && (
          <p className="text-sm text-muted-foreground mt-4 pt-4 border-t border-border/20">
            {assessment.description}
          </p>
        )}
      </GlassCard>

      {/* Sessions */}
      <GlassCard hover={false}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              Oturumlar
            </h2>
            <span className="text-xs text-muted-foreground">
              ({sessionsMeta.total})
            </span>
          </div>
        </div>

        {sessionsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-xl bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Henüz oturum bulunmuyor
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Personel atayarak oturumları başlatın
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase pb-3 pr-4">
                      Personel
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase pb-3 pr-4">
                      Durum
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase pb-3 pr-4 hidden md:table-cell">
                      Puan
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase pb-3 pr-4 hidden lg:table-cell">
                      Başlangıç
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase pb-3 hidden lg:table-cell">
                      Bitiş
                    </th>
                    <th className="pb-3 w-16" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {sessions.map((s: any) => {
                    const sBadge =
                      SESSION_STATUS[s.status] ?? SESSION_STATUS.NOT_STARTED ?? { label: "Bekliyor", className: "bg-muted text-muted-foreground" };
                    const scoreVals =
                      s.dimensionScores &&
                      typeof s.dimensionScores === "object"
                        ? Object.values(s.dimensionScores as Record<string, unknown>).filter(
                            (v): v is number => typeof v === "number",
                          )
                        : [];
                    const avgScore =
                      scoreVals.length > 0
                        ? scoreVals.reduce((a, b) => a + b, 0) /
                          scoreVals.length
                        : null;
                    return (
                      <tr
                        key={s.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedSessionId(s.id)}
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-primary">
                                {(
                                  (s.personnel?.firstName?.[0] ?? "") +
                                  (s.personnel?.lastName?.[0] ?? "")
                                ).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              {s.personnel?.firstName} {s.personnel?.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={cn(
                              "inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold",
                              sBadge.className,
                            )}
                          >
                            {sBadge.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4 hidden md:table-cell">
                          {avgScore !== null ? (
                            <span
                              className={cn(
                                "text-sm font-bold tabular-nums",
                                avgScore >= 7
                                  ? "text-accent-green"
                                  : avgScore >= 4
                                    ? "text-amber-500"
                                    : "text-destructive",
                              )}
                            >
                              {avgScore.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(s.startedAt)}
                          </span>
                        </td>
                        <td className="py-3 hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(s.completedAt)}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSessionId(s.id);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Eye className="h-3 w-3" />
                            Detay
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {sessionTotalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border/20 mt-4">
                <p className="text-xs text-muted-foreground">
                  Toplam {sessionsMeta.total} oturum
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setSessionPage((p) => Math.max(1, p - 1))
                    }
                    disabled={sessionPage <= 1}
                    className="p-1.5 rounded-lg hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs tabular-nums text-muted-foreground px-2">
                    {sessionPage} / {sessionTotalPages}
                  </span>
                  <button
                    onClick={() =>
                      setSessionPage((p) =>
                        Math.min(sessionTotalPages, p + 1),
                      )
                    }
                    disabled={sessionPage >= sessionTotalPages}
                    className="p-1.5 rounded-lg hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </GlassCard>

      {/* Personel ata — viewport ortasında (body portal) */}
      <AnimatePresence>
        {assignOpen && (
          <PortalModal key="assign">
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
              <motion.div
                className="absolute inset-0 bg-foreground/25 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setAssignOpen(false)}
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="assign-dialog-title"
                className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border/50 bg-popover shadow-xl"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
              >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <h3 id="assign-dialog-title" className="text-base font-semibold text-foreground">
                  Personel Ata
                </h3>
                <button
                  type="button"
                  onClick={() => setAssignOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              <div className="px-5 pt-4 pb-2 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Personel ara..."
                    value={personnelSearch}
                    onChange={(e) => setPersonnelSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  />
                </div>
                {selectedPersonnel.length > 0 && (
                  <p className="text-xs text-primary mt-2">
                    {selectedPersonnel.length} personel seçildi
                  </p>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-2 space-y-1">
                {personnelList.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Personel bulunamadı
                  </p>
                ) : (
                  personnelList.map((p: {
                    id: string;
                    firstName: string;
                    lastName: string;
                    position: string;
                    department?: { name?: string } | null;
                  }) => {
                    const selected = selectedPersonnel.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePersonnel(p.id)}
                        className={cn(
                          "w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors",
                          selected ? "bg-primary/10" : "hover:bg-muted/40",
                        )}
                      >
                        <div
                          className={cn(
                            "h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                            selected ? "border-primary bg-primary" : "border-border/60",
                          )}
                        >
                          {selected && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {p.position} · {p.department?.name ?? "—"}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="flex justify-end gap-2 px-5 py-4 border-t border-border/30 shrink-0">
                <button
                  type="button"
                  onClick={() => setAssignOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/60 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => void handleAssign()}
                  disabled={
                    selectedPersonnel.length === 0 || assignMutation.isPending
                  }
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {assignMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Ata ({selectedPersonnel.length})
                </button>
              </div>
              </motion.div>
            </div>
          </PortalModal>
        )}
      </AnimatePresence>

      {/* Oturum Detay Paneli */}
      <AnimatePresence>
        {selectedSessionId && (
          <PortalModal key="session-detail">
            <SessionDetailPanel
              sessionId={selectedSessionId}
              onClose={() => setSelectedSessionId(null)}
            />
          </PortalModal>
        )}
      </AnimatePresence>

      {/* Değerlendirme düzenle */}
      <AnimatePresence>
        {editOpen && assessment && (
          <PortalModal key="edit">
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
              <motion.div
                className="absolute inset-0 bg-foreground/25 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditOpen(false)}
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-dialog-title"
                className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border/50 bg-popover p-6 shadow-xl"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 id="edit-dialog-title" className="text-lg font-semibold text-foreground">
                    Değerlendirmeyi Düzenle
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <form
                  className="space-y-4"
                  onSubmit={handleEditSubmit(onEditSave)}
                >
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Başlık <span className="text-destructive">*</span>
                    </label>
                    <input
                      {...registerEdit("title")}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
                        editErrors.title && "border-destructive/60",
                      )}
                    />
                    {editErrors.title && (
                      <p className="text-xs text-destructive mt-1">{editErrors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Açıklama
                    </label>
                    <textarea
                      {...registerEdit("description")}
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border/40 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Durum
                    </label>
                    <select
                      {...registerEdit("status")}
                      className="w-full px-3 py-2.5 rounded-xl bg-muted/50 border border-border/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="DRAFT">Taslak</option>
                      <option value="ACTIVE">Aktif</option>
                      <option value="PAUSED">Duraklatıldı</option>
                      <option value="COMPLETED">Tamamlandı</option>
                      <option value="ARCHIVED">Arşiv</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Başlangıç
                      </label>
                      <Controller
                        name="startsAt"
                        control={editControl}
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
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Bitiş
                      </label>
                      <Controller
                        name="endsAt"
                        control={editControl}
                        render={({ field }) => (
                          <DateTimePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Bitiş seçin"
                            error={Boolean(editErrors.endsAt)}
                          />
                        )}
                      />
                      {editErrors.endsAt && (
                        <p className="text-xs text-destructive mt-1">{editErrors.endsAt.message}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground rounded-xl bg-muted/30 px-3 py-2">
                    Soru seti bu ekrandan değiştirilemez; gerekirse yeni bir değerlendirme oluşturun.
                  </p>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditOpen(false)}
                      className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/60 transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                    >
                      {updateMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      Kaydet
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </PortalModal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Session Detail Panel — cevaplar + AI analiz
   ───────────────────────────────────────────────────── */

const DIMENSION_LABELS: Record<string, string> = {
  LOGICAL_ALGORITHMIC: "Mantıksal / Algoritmik",
  LEADERSHIP: "Liderlik",
  SOCIAL_INTELLIGENCE: "Sosyal Zeka",
  GROWTH_POTENTIAL: "Gelişim Potansiyeli",
  DOMAIN_ALIGNMENT: "Alan Uyumu",
};

const ANALYSIS_TABS = [
  { id: "answers" as const, label: "Cevaplar", icon: MessageSquare },
  { id: "hrpdr" as const, label: "HR PDR Analizi", icon: FileText },
  { id: "psychological" as const, label: "Psikolojik Analiz", icon: Heart },
];

type AnalysisTab = (typeof ANALYSIS_TABS)[number]["id"];

function SessionDetailPanel({
  sessionId,
  onClose,
}: {
  sessionId: string;
  onClose: () => void;
}) {
  const { data: session, isLoading } = useSession(sessionId);
  const runAnalysis = useRunSessionAiAnalysis();
  const [activeTab, setActiveTab] = useState<AnalysisTab>("answers");
  const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());

  const toggleAnswer = (id: string) => {
    setExpandedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRunAnalysis = (type: "HR_PDR_ANALYSIS" | "PSYCHOLOGICAL_ANALYSIS") => {
    runAnalysis.mutate(
      { id: sessionId, analysisType: type },
      {
        onSuccess: () => toast.success("AI analizi tamamlandı"),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Analiz başarısız"),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-stretch justify-end">
      <motion.div
        className="absolute inset-0 bg-foreground/25 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 w-full max-w-3xl bg-popover border-l border-border/50 shadow-2xl flex flex-col overflow-hidden"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BrainCircuit className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Oturum Detayı
              </h2>
              {session && (
                <p className="text-xs text-muted-foreground">
                  {session.personnel.firstName} {session.personnel.lastName}
                  {session.personnel.position ? ` — ${session.personnel.position}` : ""}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted/60 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 pb-0 shrink-0">
          {ANALYSIS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-medium transition-colors border-b-2",
                activeTab === tab.id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40",
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-3 text-sm text-muted-foreground">Yükleniyor...</span>
            </div>
          ) : !session ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">Oturum bulunamadı</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "answers" && (
                <motion.div
                  key="answers"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  {session.answers.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Henüz cevap bulunmuyor</p>
                    </div>
                  ) : (
                    session.answers.map((answer: AnswerRow, idx: number) => (
                      <div
                        key={answer.id}
                        className="rounded-xl border border-border/30 bg-muted/20 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleAnswer(answer.id)}
                          className="w-full flex items-start gap-3 p-3 text-left hover:bg-muted/30 transition-colors"
                        >
                          <span className="flex-shrink-0 h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground leading-snug">
                              {answer.question?.text ?? "Soru yüklenemedi"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {answer.question?.dimension && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                                  {DIMENSION_LABELS[answer.question.dimension] ?? answer.question.dimension}
                                </span>
                              )}
                              {answer.aiScore !== null && (
                                <span className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded font-bold",
                                  answer.aiScore >= 7 ? "bg-accent-green/10 text-accent-green" :
                                  answer.aiScore >= 4 ? "bg-amber-500/10 text-amber-500" :
                                  "bg-destructive/10 text-destructive",
                                )}>
                                  AI: {answer.aiScore.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                          {expandedAnswers.has(answer.id) ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          )}
                        </button>
                        <AnimatePresence>
                          {expandedAnswers.has(answer.id) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-3 pt-0 ml-9 space-y-2">
                                {answer.textAnswer && (
                                  <div>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Cevap</p>
                                    <p className="text-sm text-foreground bg-background/50 rounded-lg p-2.5 border border-border/20">
                                      {answer.textAnswer}
                                    </p>
                                  </div>
                                )}
                                {answer.scaleValue !== null && (
                                  <div>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Puan</p>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-2 rounded-full bg-muted/60 overflow-hidden">
                                        <div
                                          className={cn(
                                            "h-full rounded-full transition-all",
                                            answer.scaleValue >= 7 ? "bg-accent-green" :
                                            answer.scaleValue >= 4 ? "bg-amber-500" : "bg-destructive",
                                          )}
                                          style={{ width: `${(answer.scaleValue / 10) * 100}%` }}
                                        />
                                      </div>
                                      <span className="text-sm font-bold tabular-nums">{answer.scaleValue}/10</span>
                                    </div>
                                  </div>
                                )}
                                {answer.choiceKey && (
                                  <div>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">Seçim</p>
                                    <p className="text-sm text-foreground">{answer.choiceKey}</p>
                                  </div>
                                )}
                                {answer.durationSec !== null && (
                                  <p className="text-[10px] text-muted-foreground">
                                    Cevaplama süresi: {Math.floor(answer.durationSec / 60)}dk {answer.durationSec % 60}sn
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {activeTab === "hrpdr" && (
                <motion.div
                  key="hrpdr"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <HrPdrAnalysisView
                    session={session}
                    onRun={() => handleRunAnalysis("HR_PDR_ANALYSIS")}
                    isRunning={runAnalysis.isPending && runAnalysis.variables?.analysisType === "HR_PDR_ANALYSIS"}
                  />
                </motion.div>
              )}

              {activeTab === "psychological" && (
                <motion.div
                  key="psychological"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <PsychologicalAnalysisView
                    session={session}
                    onRun={() => handleRunAnalysis("PSYCHOLOGICAL_ANALYSIS")}
                    isRunning={runAnalysis.isPending && runAnalysis.variables?.analysisType === "PSYCHOLOGICAL_ANALYSIS"}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ─── HR PDR Analysis View ─── */

function HrPdrAnalysisView({
  session,
  onRun,
  isRunning,
}: {
  session: SessionDetail;
  onRun: () => void;
  isRunning: boolean;
}) {
  const analysis = session.hrPdrAnalysis as Record<string, any> | null;

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <FileText className="h-7 w-7 text-primary" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">HR PDR Analizi</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Bu oturum için henüz HR Performans Değerlendirme analizi yapılmadı.
          AI analizi başlatarak cevaplar üzerinden kapsamlı bir PDR raporu oluşturun.
        </p>
        <motion.button
          onClick={onRun}
          disabled={isRunning || session.answers.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isRunning ? "Analiz Yapılıyor..." : "AI Analizi Başlat"}
        </motion.button>
        {session.answers.length === 0 && (
          <p className="text-xs text-muted-foreground/60 mt-2">Analiz için önce cevaplar gereklidir</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Yeniden analiz butonu */}
      <div className="flex justify-end">
        <button
          onClick={onRun}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
        >
          {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Yeniden Analiz Et
        </button>
      </div>

      {/* Performans Özeti */}
      {analysis.performanceScore != null && (
        <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold",
              analysis.performanceScore >= 7 ? "bg-accent-green/10 text-accent-green" :
              analysis.performanceScore >= 4 ? "bg-amber-500/10 text-amber-500" : "bg-destructive/10 text-destructive",
            )}>
              {Number(analysis.performanceScore).toFixed(1)}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Performans Puanı</h4>
              <p className="text-xs text-muted-foreground">
                {analysis.promotionReadiness === "READY" ? "Terfi için hazır" :
                 analysis.promotionReadiness === "DEVELOPING" ? "Gelişim sürecinde" : "Henüz hazır değil"}
              </p>
            </div>
          </div>
          {analysis.performanceSummary && (
            <p className="text-sm text-foreground/80">{analysis.performanceSummary}</p>
          )}
        </div>
      )}

      {/* Güçlü Yönler */}
      {Array.isArray(analysis.strengths) && analysis.strengths.length > 0 && (
        <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent-green" />
            Güçlü Yönler
          </h4>
          <ul className="space-y-1">
            {analysis.strengths.map((s: string, i: number) => (
              <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                <span className="text-accent-green mt-1">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Gelişim Alanları */}
      {Array.isArray(analysis.developmentAreas) && analysis.developmentAreas.length > 0 && (
        <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <Target className="h-4 w-4 text-amber-500" />
            Gelişim Alanları
          </h4>
          <ul className="space-y-2">
            {analysis.developmentAreas.map((d: any, i: number) => (
              <li key={i} className="text-sm">
                <span className="font-medium text-foreground">{d.area}</span>
                {d.recommendation && (
                  <p className="text-foreground/60 text-xs mt-0.5">{d.recommendation}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Yetkinlik Analizi */}
      {Array.isArray(analysis.competencyAnalysis) && analysis.competencyAnalysis.length > 0 && (
        <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Yetkinlik Analizi</h4>
          <div className="space-y-3">
            {analysis.competencyAnalysis.map((comp: any, i: number) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">
                    {DIMENSION_LABELS[comp.dimension] ?? comp.dimension}
                  </span>
                  <span className={cn(
                    "text-xs font-bold tabular-nums",
                    comp.score >= 7 ? "text-accent-green" : comp.score >= 4 ? "text-amber-500" : "text-destructive",
                  )}>
                    {comp.score}/10
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      comp.score >= 7 ? "bg-accent-green" : comp.score >= 4 ? "bg-amber-500" : "bg-destructive",
                    )}
                    style={{ width: `${(comp.score / 10) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hedefler */}
      {analysis.goals && (
        <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Hedef Önerileri</h4>
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: "Kısa Vadeli (3 ay)", items: analysis.goals.shortTerm },
              { label: "Orta Vadeli (6 ay)", items: analysis.goals.midTerm },
              { label: "Uzun Vadeli (1 yıl)", items: analysis.goals.longTerm },
            ].map((group) => (
              Array.isArray(group.items) && group.items.length > 0 && (
                <div key={group.label}>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">{group.label}</p>
                  <ul className="space-y-0.5">
                    {group.items.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-foreground/80 pl-3 relative before:absolute before:left-0 before:top-[7px] before:h-1 before:w-1 before:rounded-full before:bg-primary/50">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Eğitim İhtiyaçları */}
      {Array.isArray(analysis.trainingNeeds) && analysis.trainingNeeds.length > 0 && (
        <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Eğitim İhtiyaçları</h4>
          <div className="flex flex-wrap gap-1.5">
            {analysis.trainingNeeds.map((t: string, i: number) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-medium">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Genel Değerlendirme */}
      {analysis.overallRecommendation && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-1">Genel Değerlendirme</h4>
          <p className="text-sm text-foreground/80">{analysis.overallRecommendation}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Psychological Analysis View ─── */

function PsychologicalAnalysisView({
  session,
  onRun,
  isRunning,
}: {
  session: SessionDetail;
  onRun: () => void;
  isRunning: boolean;
}) {
  const analysis = session.psychologicalAnalysis as Record<string, any> | null;

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-14 w-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
          <Heart className="h-7 w-7 text-purple-500" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1">Psikolojik Analiz</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Bu oturum için henüz psikolojik analiz yapılmadı.
          AI analizi başlatarak Big Five kişilik profili, duygusal zeka ve daha fazlasını keşfedin.
        </p>
        <motion.button
          onClick={onRun}
          disabled={isRunning || session.answers.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-semibold hover:bg-purple-500/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {isRunning ? "Analiz Yapılıyor..." : "AI Analizi Başlat"}
        </motion.button>
        {session.answers.length === 0 && (
          <p className="text-xs text-muted-foreground/60 mt-2">Analiz için önce cevaplar gereklidir</p>
        )}
      </div>
    );
  }

  const bigFive = analysis.personalityProfile;
  const ei = analysis.emotionalIntelligence;

  return (
    <div className="space-y-4">
      {/* Yeniden analiz butonu */}
      <div className="flex justify-end">
        <button
          onClick={onRun}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-500 hover:bg-purple-500/10 transition-colors disabled:opacity-50"
        >
          {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Yeniden Analiz Et
        </button>
      </div>

      {/* Big Five Kişilik Profili */}
      {bigFive && (
        <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Big Five Kişilik Profili</h4>
          <div className="space-y-3">
            {[
              { key: "openness", label: "Deneyime Açıklık", color: "bg-blue-500" },
              { key: "conscientiousness", label: "Sorumluluk", color: "bg-green-500" },
              { key: "extraversion", label: "Dışadönüklük", color: "bg-amber-500" },
              { key: "agreeableness", label: "Uyumluluk", color: "bg-pink-500" },
              { key: "neuroticism", label: "Duygusal Denge", color: "bg-purple-500" },
            ].map((trait) => {
              const data = bigFive[trait.key];
              if (!data) return null;
              return (
                <div key={trait.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">{trait.label}</span>
                    <span className="text-xs font-bold tabular-nums text-foreground">{data.score}/10</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", trait.color)}
                      style={{ width: `${(data.score / 10) * 100}%` }}
                    />
                  </div>
                  {data.description && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{data.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Duygusal Zeka */}
      {ei && (
        <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Duygusal Zeka</h4>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {[
              { key: "selfAwareness", label: "Öz Farkındalık" },
              { key: "selfRegulation", label: "Öz Düzenleme" },
              { key: "motivation", label: "Motivasyon" },
              { key: "empathy", label: "Empati" },
              { key: "socialSkills", label: "Sosyal Beceri" },
            ].map((dim) => {
              const val = ei[dim.key];
              if (val == null) return null;
              return (
                <div key={dim.key} className="text-center">
                  <div className={cn(
                    "h-10 w-10 mx-auto rounded-xl flex items-center justify-center text-sm font-bold mb-1",
                    val >= 7 ? "bg-accent-green/10 text-accent-green" :
                    val >= 4 ? "bg-amber-500/10 text-amber-500" : "bg-destructive/10 text-destructive",
                  )}>
                    {val}
                  </div>
                  <p className="text-[9px] text-muted-foreground leading-tight">{dim.label}</p>
                </div>
              );
            })}
          </div>
          {ei.summary && <p className="text-xs text-foreground/80">{ei.summary}</p>}
        </div>
      )}

      {/* Stres Yönetimi */}
      {analysis.stressManagement && (
        <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Stres Yönetimi</h4>
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded-lg font-semibold",
            analysis.stressManagement.level === "LOW" ? "bg-accent-green/10 text-accent-green" :
            analysis.stressManagement.level === "MODERATE" ? "bg-amber-500/10 text-amber-500" :
            "bg-destructive/10 text-destructive",
          )}>
            {analysis.stressManagement.level === "LOW" ? "Düşük" :
             analysis.stressManagement.level === "MODERATE" ? "Orta" : "Yüksek"}
          </span>
          {Array.isArray(analysis.stressManagement.copingStrategies) && (
            <div className="mt-2">
              <p className="text-[10px] text-muted-foreground uppercase font-medium mb-1">Başa Çıkma Stratejileri</p>
              <ul className="space-y-0.5">
                {analysis.stressManagement.copingStrategies.map((s: string, i: number) => (
                  <li key={i} className="text-xs text-foreground/80">{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Motivasyon Profili */}
      {analysis.motivationProfile && (
        <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Motivasyon Profili</h4>
          <div className="grid grid-cols-2 gap-3">
            {Array.isArray(analysis.motivationProfile.intrinsic) && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium mb-1">İçsel</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.motivationProfile.intrinsic.map((m: string, i: number) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-accent-green/10 text-accent-green">{m}</span>
                  ))}
                </div>
              </div>
            )}
            {Array.isArray(analysis.motivationProfile.extrinsic) && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium mb-1">Dışsal</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.motivationProfile.extrinsic.map((m: string, i: number) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          {analysis.motivationProfile.summary && (
            <p className="text-xs text-foreground/80 mt-2">{analysis.motivationProfile.summary}</p>
          )}
        </div>
      )}

      {/* Ekip Dinamikleri */}
      {analysis.teamDynamics && (
        <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-2">Ekip Dinamikleri</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Rol:</span>{" "}
              <span className="font-medium text-foreground">{analysis.teamDynamics.role}</span>
            </div>
            <div>
              <span className="text-muted-foreground">İşbirliği:</span>{" "}
              <span className="font-medium text-foreground">{analysis.teamDynamics.collaborationStyle}</span>
            </div>
          </div>
        </div>
      )}

      {/* Karar Verme & Dayanıklılık */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {analysis.decisionMaking && (
          <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-1">Karar Verme</h4>
            <p className="text-xs text-foreground/80">{analysis.decisionMaking.style}</p>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded font-medium mt-1 inline-block",
              analysis.decisionMaking.riskTolerance === "LOW" ? "bg-accent-green/10 text-accent-green" :
              analysis.decisionMaking.riskTolerance === "MODERATE" ? "bg-amber-500/10 text-amber-500" :
              "bg-destructive/10 text-destructive",
            )}>
              Risk: {analysis.decisionMaking.riskTolerance === "LOW" ? "Düşük" :
                     analysis.decisionMaking.riskTolerance === "MODERATE" ? "Orta" : "Yüksek"}
            </span>
          </div>
        )}
        {analysis.resilience && (
          <div className="rounded-xl border border-border/30 bg-muted/20 p-4">
            <h4 className="text-sm font-semibold text-foreground mb-1">Psikolojik Dayanıklılık</h4>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-2 rounded-full bg-muted/60 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    analysis.resilience.score >= 7 ? "bg-accent-green" :
                    analysis.resilience.score >= 4 ? "bg-amber-500" : "bg-destructive",
                  )}
                  style={{ width: `${(analysis.resilience.score / 10) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold tabular-nums">{analysis.resilience.score}/10</span>
            </div>
            <p className="text-[10px] text-foreground/60">{analysis.resilience.description}</p>
          </div>
        )}
      </div>

      {/* Genel Psikolojik Profil */}
      {analysis.overallPsychologicalProfile && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
          <h4 className="text-sm font-semibold text-foreground mb-1">Genel Psikolojik Profil</h4>
          <p className="text-sm text-foreground/80">{analysis.overallPsychologicalProfile}</p>
        </div>
      )}
    </div>
  );
}
