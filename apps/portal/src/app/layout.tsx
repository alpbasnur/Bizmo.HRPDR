import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PotansiyelHaritası — Personel Değerlendirmesi",
  description: "Kişisel gelişim ve kariyer değerlendirme platformu",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${inter.className} min-h-screen w-full`}>
        {children}
        <Toaster position="top-center" richColors toastOptions={{ className: "rounded-xl" }} />
      </body>
    </html>
  );
}
