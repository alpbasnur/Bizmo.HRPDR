import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}

export function getScoreColor(
  score: number
): "emerald" | "amber" | "destructive" {
  if (score >= 7.0) return "emerald";
  if (score >= 4.0) return "amber";
  return "destructive";
}

export function getScorePercent(score: number, max = 10): number {
  return Math.round((score / max) * 100);
}
