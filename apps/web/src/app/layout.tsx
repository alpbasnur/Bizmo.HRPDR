import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "PotansiyelHaritası — Yönetim Paneli",
  description: "AI Destekli Personel Değerlendirme Platformu",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="min-h-screen w-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
