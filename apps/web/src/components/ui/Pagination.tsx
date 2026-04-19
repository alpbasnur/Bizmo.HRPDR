"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@ph/ui";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2.5 backdrop-blur-sm",
        className,
      )}
    >
      <span className="text-sm text-muted-foreground">
        {total === 0 ? "Sonuç bulunamadı" : `${start}–${end} / ${total} sonuç`}
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            canPrev
              ? "hover:bg-accent/20 text-foreground"
              : "cursor-not-allowed text-muted-foreground/40",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="min-w-[3rem] text-center text-sm font-medium tabular-nums">
          {page} / {totalPages}
        </span>

        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            canNext
              ? "hover:bg-accent/20 text-foreground"
              : "cursor-not-allowed text-muted-foreground/40",
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
