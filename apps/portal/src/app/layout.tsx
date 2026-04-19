import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "PotansiyelHaritası — Personel Değerlendirmesi",
  description: "Kişisel gelişim ve kariyer değerlendirme platformu",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen w-full">
        {children}
        <Toaster position="top-center" richColors toastOptions={{ className: "rounded-xl" }} />
      </body>
    </html>
  );
}
