import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ifc2go — Every IFC tool you need, free in your browser",
  description:
    "Clean, validate, edit and organize IFC files instantly. No installs, no licence fees. IFC2x3, IFC4, IFC4.3 supported.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-dvh flex flex-col bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
