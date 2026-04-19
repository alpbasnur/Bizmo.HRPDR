import { GlassSidebar } from "@/components/layout/GlassSidebar";
import { GlassTopbar } from "@/components/layout/GlassTopbar";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { AiChatDock } from "@/components/ai-chat/AiChatDock";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <GlassSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <GlassTopbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
            {children}
          </main>
        </div>
        <AiChatDock />
      </div>
    </AuthGuard>
  );
}
