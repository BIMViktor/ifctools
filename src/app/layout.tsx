import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ifctools.io — The IFC toolkit for BIM coordinators",
  description:
    "View, validate, extract, recolour, merge and split IFC files — all running in your browser, with no installs and no per-seat licences.",
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
