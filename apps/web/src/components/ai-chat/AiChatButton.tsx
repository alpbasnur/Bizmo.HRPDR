"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiChatButton({
  onClick,
  open,
}: {
  onClick: () => void;
  open: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={open ? "Sohbet panelini kapat" : "İK AI Asistanını aç"}
      className={cn(
        "fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition",
        "border border-white/15 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground",
        "hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      )}
    >
      <MessageCircle className="h-7 w-7" />
    </button>
  );
}
