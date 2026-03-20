import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MatrixRain from "./components/MatrixRain";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Realify",
  description: "AI Image Generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        style={{ position: "relative" }}
      >
        {/* 🔥 MATRIX BACKGROUND */}
        <MatrixRain />

        {/* 🔥 APP CONTENT (ABOVE MATRIX) */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
