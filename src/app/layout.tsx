import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Junto",
  description: "Organizá viajes grupales de principio a fin, sin que recaiga todo en una persona.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={manrope.variable}>
      <body className="min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">{children}</div>
      </body>
    </html>
  );
}
