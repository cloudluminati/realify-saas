'use client'

import { useEffect, useRef } from 'react'

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let drops: number[] = []

    const letters = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const fontSize = 16

    function setupCanvas() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      const columns = Math.floor(canvas.width / fontSize)
      drops = Array(columns).fill(1)
    }

    function draw() {
      ctx.fillStyle = 'rgba(0,0,0,0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#00ff9c'
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = letters.charAt(
          Math.floor(Math.random() * letters.length)
        )

        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }

        drops[i]++
      }

      animationFrameId = window.requestAnimationFrame(draw)
    }

    setupCanvas()
    window.addEventListener('resize', setupCanvas)
    animationFrameId = window.requestAnimationFrame(draw)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', setupCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
