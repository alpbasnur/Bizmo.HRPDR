"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
} from "lucide-react";
import { GlassCard } from "@ph/ui";
import { cn } from "@/lib/utils";
import { useAssessmentList } from "@/hooks/use-api";

const STATUS_TABS = [
  { label: "Tümü", value: undefined },
  { label: "Taslak", value: "DRAFT" },
  { label: "Aktif", value: "ACTIVE" },
  { label: "Tamamlanan", value: "COMPLETED" },
  { label: "Arşiv", value: "ARCHIVED" },
] as const;

const STATUS_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Taslak",
    className: "bg-muted text-muted-foreground",
  },
  ACTIVE: {
    label: "Aktif",
    className: "bg-accent-green/10 text-accent-green",
  },
  PAUSED: {
    label: "Duraklatıldı",
    className: "bg-amber-500/10 text-amber-500",
  },
  COMPLETED: {
    label: "Tamamlandı",
    className: "bg-sky-500/10 text-sky-500",
  },
  ARCHIVED: {
    label: "Arşiv",
    className: "bg-muted text-muted-foreground",
  },
};

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function AssessmentsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAssessmentList({
    status: statusFilter,
    search: search || undefined,
    page,
    pageSize: 20,
  });

  const assessments = data?.items ?? [];
  const meta = {
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? 20,
  };
  const totalPages = Math.ceil(meta.total / meta.pageSize) || 1;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Değerlendirmeler
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tüm değerlendirmeleri yönetin ve takip edin
          </p>
        </div>
        <button
          onClick={() => router.push("/assessments/new")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors active:scale-[0.97]"
        >
          <Plus className="h-4 w-4" />
          Yeni Değerlendirme
        </button>
      </motion.div>

      {/* Filters */}
      <GlassCard hover={false} className="!p-3 md:!p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Status tabs */}
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.label}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                  statusFilter === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/60",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative sm:ml-auto sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Ara..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/50 border border-border/40 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard hover={false}>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        ) : assessments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Henüz değerlendirme bulunmuyor
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Yeni bir değerlendirme oluşturarak başlayın
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase pb-3 pr-4">
                      Başlık
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase pb-3 pr-4 hidden md:table-cell">
                      Soru Seti
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase pb-3 pr-4">
                      Durum
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase pb-3 pr-4 hidden lg:table-cell">
                      Oturumlar
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase pb-3 hidden sm:table-cell">
                      Tarih Aralığı
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {assessments.map((a: any) => {
                    const badge = STATUS_BADGE[a.status] ?? STATUS_BADGE.DRAFT ?? { label: "Taslak", className: "bg-muted text-muted-foreground" };
                    return (
                      <tr
                        key={a.id}
                        onClick={() => router.push(`/assessments/${a.id}`)}
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 pr-4">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {a.title}
                          </p>
                          {a.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {a.description}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 pr-4 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {a.questionSet?.name ?? "—"}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4">
                          <span
                            className={cn(
                              "inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold",
                              badge.className,
                            )}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm tabular-nums text-muted-foreground">
                              {a.sessionStats?.completed ?? 0}/
                              {a.sessionStats?.total ?? 0}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 hidden sm:table-cell">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(a.startsAt)} – {formatDate(a.endsAt)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border/20 mt-4">
                <p className="text-xs text-muted-foreground">
                  Toplam {meta.total} kayıt
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs tabular-nums text-muted-foreground px-2">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page >= totalPages}
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
    </div>
  );
}
