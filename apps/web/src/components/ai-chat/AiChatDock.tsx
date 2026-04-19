"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { GlassCard } from "@ph/ui";
import { AiChatButton } from "./AiChatButton";
import { AiChatWorkArea } from "./AiChatWorkArea";

export function AiChatDock() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <AiChatButton open={open} onClick={() => setOpen((o) => !o)} />

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Paneli kapat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[58] bg-black/50 backdrop-blur-sm md:bg-black/40"
              onClick={() => setOpen(false)}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="ai-chat-panel-title"
              initial={{ x: "100%", opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.9 }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 right-0 top-0 z-[59] flex w-full max-w-[min(100vw,440px)] flex-col p-3 pt-14 md:p-4 md:pt-6"
            >
              <GlassCard className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute right-3 top-3 z-10 rounded-lg p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                  aria-label="Kapat"
                >
                  <X className="h-5 w-5" />
                </button>
                <span id="ai-chat-panel-title" className="sr-only">
                  İK AI Asistanı sohbet paneli
                </span>
                <AiChatWorkArea embedded className="flex-1 border-0" />
              </GlassCard>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
