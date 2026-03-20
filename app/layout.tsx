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
              AI Image Generator
            </h1>
            <p style={{ opacity: 0.7 }}>
              Create images from text prompts instantly.
            </p>
          </div>

          {/* CARD CONTAINER */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              background: "rgba(20,20,30,0.7)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "20px",
              padding: "20px",
              backdropFilter: "blur(20px)",
            }}
          >
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
