import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { InitializeDB } from "./initialize-db";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YouTube App",
  description: "A modern YouTube application built with Next.js 13, TypeScript, and Tailwind CSS",
  keywords: ["youtube", "videos", "streaming"],
  authors: [{ name: "Development Team" }],
  creator: "Development Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://example.com",
    title: "YouTube App",
    description: "A modern YouTube application built with Next.js 13, TypeScript, and Tailwind CSS",
    siteName: "YouTube App",
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube App",
    description: "A modern YouTube application built with Next.js 13, TypeScript, and Tailwind CSS",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-theme`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <InitializeDB />
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
