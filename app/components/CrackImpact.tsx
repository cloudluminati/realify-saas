"use client"

import { useEffect, useState } from "react"

export default function CrackImpact() {
  const [cracked, setCracked] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setCracked(true)
    }, 800) // delay before crack

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {/* IMPACT FLASH */}
      {!cracked && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "radial-gradient(circle at center, white 0%, transparent 60%)",
            opacity: 0.6,
            zIndex: 40,
            pointerEvents: "none",
            animation: "impactFlash 0.8s ease-out forwards"
          }}
        />
      )}

      {/* CRACK IMAGE */}
      {cracked && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundImage: "url('/crt-monitor.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            zIndex: 30,
            pointerEvents: "none"
          }}
        />
      )}
    </>
  )
}
