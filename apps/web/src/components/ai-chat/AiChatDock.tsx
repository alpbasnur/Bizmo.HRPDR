"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { AiChatButton } from "./AiChatButton";
import { AiChatWorkArea } from "./AiChatWorkArea";

/** Admin üst çubuğu (h-14 / sm:h-16) + güvenli alan — panel bunun altından başlar */
const PANEL_TOP_CLASS = "top-14 sm:top-16";

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

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {!open ? (
        <AiChatButton open={open} onClick={() => setOpen((o) => !o)} />
      ) : null}

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
              className="fixed inset-0 z-[58] bg-black/50 backdrop-blur-sm md:bg-black/35"
              onClick={() => setOpen(false)}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="ai-chat-panel-title"
              initial={{ x: "105%", opacity: 0.96 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "105%", opacity: 0.96 }}
              transition={{ type: "spring", damping: 30, stiffness: 320 }}
              className={`pointer-events-none fixed ${PANEL_TOP_CLASS} bottom-0 right-0 z-[59] flex max-h-[calc(100dvh-3.5rem)] justify-end overflow-visible pb-2 pt-3 sm:right-3 sm:bottom-3 sm:max-h-[calc(100dvh-5.5rem)] sm:pb-3 sm:pr-3 sm:pt-4`}
            >
              {/* Kart genişliği tekrar tam viewport / 560px — Kapat küçük ekranda kart köşesinde, sm+ solda */}
              <div className="relative pointer-events-auto flex h-full w-full max-w-[min(100vw,560px)] min-w-0 flex-col">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Kapat"
                  className="pointer-events-auto fixed right-3 top-16 z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-border/50 bg-background/95 text-muted-foreground shadow-lg shadow-black/10 backdrop-blur-xl transition hover:border-border hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/15 dark:bg-background/90 dark:shadow-black/40 sm:absolute sm:inset-auto sm:right-full sm:top-1 sm:z-10 sm:mr-3 sm:mt-0.5"
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/40 bg-background/80 shadow-2xl shadow-black/15 backdrop-blur-xl dark:bg-background/75 dark:shadow-black/40">
                  <span id="ai-chat-panel-title" className="sr-only">
                    İK AI Asistanı sohbet paneli
                  </span>
                  <AiChatWorkArea
                    embedded
                    className="min-h-0 flex-1 border-0 bg-transparent pt-1"
                  />
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
