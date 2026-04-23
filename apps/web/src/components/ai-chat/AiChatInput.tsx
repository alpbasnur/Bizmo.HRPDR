"use client";

import { useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

export function AiChatInput({
  onSend,
  disabled,
  placeholder = "Sorunuzu yazın…",
}: {
  onSend: (text: string) => void | Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");

  const submit = async () => {
    const t = value.trim();
    if (!t || disabled) return;
    setValue("");
    await onSend(t);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div
      className={cn(
        "flex items-end gap-2 rounded-xl border border-border/60 bg-muted/40 p-2 dark:bg-black/25",
      )}
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={2}
        className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-lg bg-background/80 px-2.5 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring sm:max-h-36"
      />
      <button
        type="button"
        onClick={() => void submit()}
        disabled={disabled || !value.trim()}
        className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40 sm:h-11 sm:w-11"
        aria-label="Gönder"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}
