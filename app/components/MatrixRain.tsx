'use client'

import { useEffect, useRef } from 'react'

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let animationFrameId = 0
    let drops: number[] = []

    const letters = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const fontSize = 16

    function setupCanvas() {
      const currentCanvas = canvasRef.current
      if (!currentCanvas) return

      currentCanvas.width = window.innerWidth
      currentCanvas.height = window.innerHeight

      const columns = Math.floor(currentCanvas.width / fontSize)
      drops = Array(columns).fill(1)
    }

    function draw() {
      const currentCanvas = canvasRef.current
      if (!currentCanvas) return

      const currentCtx = currentCanvas.getContext('2d')
      if (!currentCtx) return

      currentCtx.fillStyle = 'rgba(0,0,0,0.05)'
      currentCtx.fillRect(0, 0, currentCanvas.width, currentCanvas.height)

      currentCtx.fillStyle = '#00ff9c'
      currentCtx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = letters.charAt(
          Math.floor(Math.random() * letters.length)
        )

        currentCtx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > currentCanvas.height && Math.random() > 0.975) {
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
