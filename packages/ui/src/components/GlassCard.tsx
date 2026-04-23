"use client";

import { memo } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "../lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  hover?: boolean;
  /** Mount entrance animation (default off — use parent stagger or set true for hero cards). */
  animate?: boolean;
  children: React.ReactNode;
}

export const GlassCard = memo(function GlassCard({
  className,
  hover = true,
  animate = false,
  children,
  ...props
}: GlassCardProps) {
  const entrance =
    animate === true
      ? {
          initial: { opacity: 0, y: 8 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: {
            duration: 0.35,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
          },
        }
      : { initial: false as const };

  return (
    <motion.div
      className={cn(
        hover ? "glass-surface" : "glass-surface-static",
        "rounded-xl p-5 md:p-6",
        className
      )}
      {...entrance}
      {...props}
    >
      {children}
    </motion.div>
  );
});
