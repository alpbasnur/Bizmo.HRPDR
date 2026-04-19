import { cn } from "@ph/ui";
import type { ReactNode } from "react";

const variantStyles = {
  success:
    "bg-accent-green/15 text-accent-green border-accent-green/25",
  warning:
    "bg-accent-orange/15 text-accent-orange border-accent-orange/25",
  error:
    "bg-accent-red/15 text-accent-red border-accent-red/25",
  info:
    "bg-accent-blue/15 text-accent-blue border-accent-blue/25",
  ai:
    "bg-accent-purple/15 text-accent-purple border-accent-purple/25",
  neutral:
    "bg-muted/60 text-muted-foreground border-border/40",
} as const;

type BadgeVariant = keyof typeof variantStyles;

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  className?: string;
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
