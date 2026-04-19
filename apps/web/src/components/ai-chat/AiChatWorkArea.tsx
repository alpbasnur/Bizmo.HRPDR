"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Loader2, MessageSquarePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@ph/ui";
import {
  useAiChatConversation,
  useAiChatConversations,
  useCreateAiChatConversation,
  useDeleteAiChatConversation,
  useSendAiChatMessage,
} from "@/hooks/use-api";
import { AiChatMessageList } from "./AiChatMessageList";
import { AiChatInput } from "./AiChatInput";
import { cn } from "@/lib/utils";

function AiChatOuter({
  embedded,
  className,
  children,
}: {
  embedded: boolean;
  className?: string;
  children: ReactNode;
}) {
  if (embedded) {
    return <div className={className}>{children}</div>;
  }
  return <GlassCard className={className}>{children}</GlassCard>;
}

export function AiChatWorkArea({
  embedded = false,
  className,
}: {
  embedded?: boolean;
  className?: string;
}) {
  const [conversationId, setConversationId] = useState<string | null>(null);

  const { data: list } = useAiChatConversations();
  const { data: detail, isLoading: loadingDetail } =
    useAiChatConversation(conversationId);
  const createConv = useCreateAiChatConversation();
  const sendMsg = useSendAiChatMessage();
  const deleteConv = useDeleteAiChatConversation();

  const messages = useMemo(
    () =>
      (detail?.messages ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    [detail?.messages],
  );

  const busy =
    createConv.isPending || sendMsg.isPending || deleteConv.isPending;

  const handleSend = async (text: string) => {
    try {
      let id = conversationId;
      if (!id) {
        const c = await createConv.mutateAsync({});
        id = c.id;
        setConversationId(id);
      }
      await sendMsg.mutateAsync({ conversationId: id, content: text });
    } catch (e) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data
              ?.message
          : undefined;
      toast.error(msg ?? "Mesaj gönderilemedi");
    }
  };

  const newChat = () => setConversationId(null);

  const removeChat = async () => {
    if (!conversationId) return;
    try {
      await deleteConv.mutateAsync(conversationId);
      setConversationId(null);
      toast.success("Sohbet silindi");
    } catch {
      toast.error("Sohbet silinemedi");
    }
  };

  return (
    <AiChatOuter
      embedded={embedded}
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden p-0",
        embedded ? "h-full bg-transparent" : "",
        className,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-3",
          embedded ? "" : "rounded-t-2xl",
        )}
      >
        <div className="min-w-0 flex-1">
          <h2
            className={cn(
              "font-semibold tracking-tight text-foreground",
              embedded ? "text-base" : "text-lg",
            )}
          >
            İK AI Asistanı
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            Değerlendirme verilerine göre terfi, amirlik ve aday önerileri
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={newChat}
            className="rounded-lg p-2 text-muted-foreground hover:bg-white/10 hover:text-foreground"
            title="Yeni sohbet"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </button>
          {conversationId ? (
            <button
              type="button"
              onClick={() => void removeChat()}
              disabled={busy}
              className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/15 hover:text-red-400"
              title="Sohbeti sil"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row">
        <aside className="flex max-h-40 shrink-0 flex-col gap-1 overflow-y-auto border-b border-white/10 px-2 py-2 md:max-h-none md:w-52 md:border-b-0 md:border-r md:px-3">
          <span className="px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Sohbetler
          </span>
          {(list ?? []).length === 0 ? (
            <p className="px-2 text-xs text-muted-foreground">Henüz yok</p>
          ) : (
            (list ?? []).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setConversationId(c.id)}
                className={cn(
                  "truncate rounded-lg px-2 py-2 text-left text-xs transition",
                  conversationId === c.id
                    ? "bg-primary/20 text-foreground"
                    : "hover:bg-white/5",
                )}
              >
                {c.title?.trim() || "Yeni sohbet"}
              </button>
            ))
          )}
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 p-4">
          {loadingDetail && conversationId ? (
            <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Yükleniyor…</span>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {!conversationId && messages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center text-sm text-muted-foreground">
                  <p className="mb-2 font-medium text-foreground/90">
                    Örnek sorular
                  </p>
                  <ul className="space-y-2 text-left text-xs">
                    <li>
                      • &quot;Üretim bölümünde vardiya amiri açığı var, kimi
                      önerirsin?&quot;
                    </li>
                    <li>
                      • &quot;Liderlik skoru yüksek ve terfiye hazır personel
                      kimler?&quot;
                    </li>
                  </ul>
                </div>
              ) : (
                <AiChatMessageList messages={messages} />
              )}
              {sendMsg.isPending ? (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Asistan yanıt yazıyor…
                </div>
              ) : null}
            </div>
          )}

          <AiChatInput
            onSend={handleSend}
            disabled={busy}
            placeholder="Departman veya pozisyon bağlamında sorunuzu yazın…"
          />
        </div>
      </div>
    </AiChatOuter>
  );
}
