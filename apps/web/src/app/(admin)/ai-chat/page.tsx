"use client";

import { AiChatWorkArea } from "@/components/ai-chat/AiChatWorkArea";

export default function AiChatPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[480px] flex-col gap-4">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          İK AI Asistanı
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personel değerlendirme sonuçlarına dayalı terfi ve rol önerileri için
          sorularınızı yazın. Belirli bir bölüm adı geçirdiğinizde liste o
          departmana göre daraltılır.
        </p>
      </div>

      <AiChatWorkArea className="min-h-0 flex-1 rounded-2xl border border-white/10" />
    </div>
  );
}
