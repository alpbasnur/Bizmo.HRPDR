"use client";

import { cn } from "@/lib/utils";

export interface ChatMsg {
  id: string;
  role: string;
  content: string;
  createdAt?: string;
}

export function AiChatMessageList({
  messages,
  className,
}: {
  messages: ChatMsg[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {messages.map((m) => (
        <div
          key={m.id}
          className={cn(
            "max-w-[95%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
            m.role === "user"
              ? "ml-auto bg-primary/90 text-primary-foreground"
              : "mr-auto border border-white/10 bg-white/5 text-foreground backdrop-blur-sm",
          )}
        >
          <div className="whitespace-pre-wrap break-words">{m.content}</div>
        </div>
      ))}
    </div>
  );
}
