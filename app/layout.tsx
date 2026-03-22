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
  description: "Realify AI",
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
        {/* MATRIX BACKGROUND */}
        <MatrixRain />

        {/* MAIN WRAPPER */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            padding: "40px 20px",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {/* HEADER */}
          <div style={{ marginBottom: "20px" }}>
            <h1 style={{ fontSize: "36px", fontWeight: 700 }}>
              Realify
            </h1>
          </div>

          {/* CONTENT (NO FORCED GRID ANYMORE) */}
          {children}

        </div>
      </body>
    </html>
  );
}
