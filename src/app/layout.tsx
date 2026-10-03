import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sur IPhone | iPhones en Esquel · Precios en USD y cuotas",
  description:
    "Comprá tu iPhone (11 al 17) en Sur IPhone. Stock en tiempo real, precios en USD contado y financiación en 3 cuotas. Seguinos en @esquel_iphone.",
  openGraph: {
    title: "Sur IPhone",
    description: "iPhones con precios en USD contado y financiación en cuotas.",
    locale: "es_AR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-black text-white">{children}</body>
    </html>
  );
}
