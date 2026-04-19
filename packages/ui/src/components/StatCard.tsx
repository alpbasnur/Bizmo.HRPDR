"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { GlassCard } from "./GlassCard";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  className?: string;
}

export const StatCard = ({
  title,
  value,
  subtitle,
  change,
  changeType = "neutral",
  icon: Icon,
  className,
}: StatCardProps) => (
  <GlassCard className={cn("flex flex-col gap-3", className)}>
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground font-medium">{title}</span>
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-[18px] w-[18px] text-primary" />
      </div>
    </div>
    <div>
      <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      {(change || subtitle) && (
        <div className="flex items-center gap-2 mt-1">
          {change && (
            <span
              className={cn(
                "text-xs font-semibold px-1.5 py-0.5 rounded-md",
                changeType === "positive" &&
                  "text-accent-green bg-accent-green/10",
                changeType === "negative" && "text-accent-red bg-accent-red/10",
                changeType === "neutral" && "text-muted-foreground bg-muted"
              )}
            >
              {change}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  </GlassCard>
);
