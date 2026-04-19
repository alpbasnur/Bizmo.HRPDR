"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "../lib/utils";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  hover?: boolean;
  children: React.ReactNode;
}

export const GlassCard = ({
  className,
  hover = true,
  children,
  ...props
}: GlassCardProps) => (
  <motion.div
    className={cn(
      hover ? "glass-surface" : "glass-surface-static",
      "rounded-xl p-5 md:p-6",
      className
    )}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    {...props}
  >
    {children}
  </motion.div>
);
