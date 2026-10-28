import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'

type Position = { x: number; y: number; width: number }
export function useWindowControls() {
  const frame = useRef<HTMLElement>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const [maximized, setMaximized] = useState(false)
  const [visible, setVisible] = useState(true)
  const [minimized, setMinimized] = useState(false)
  const [minimizing, setMinimizing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ x: number; y: number; left: number; top: number; width: number; pointer: number } | null>(null)
  const timer = useRef<number | undefined>(undefined)
  function constrain(x: number, y: number, width: number): Position {
    const nextWidth = Math.min(width, window.innerWidth - 20)
    return { x: Math.max(0, Math.min(x, window.innerWidth - nextWidth)), y: Math.max(0, Math.min(y, window.innerHeight - 250)), width: nextWidth }
  }
  useEffect(() => {
    const resize = () => { if (window.innerWidth < 768) setPosition(null); else setPosition(p => p ? constrain(p.x, p.y, p.width) : null) }
    window.addEventListener('resize', resize)
    return () => { window.removeEventListener('resize', resize); window.clearTimeout(timer.current) }
  }, [])
  function restore() { window.clearTimeout(timer.current); setMinimizing(false); setMinimized(false); setVisible(true) }
  function minimize() {
    if (minimizing) return
    setDragging(false); drag.current = null
    setMinimizing(true)
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200
    timer.current = window.setTimeout(() => { setVisible(false); setMinimized(true); setMinimizing(false) }, duration)
  }
  function close() { window.clearTimeout(timer.current); setVisible(false); setMinimized(false); setMinimizing(false); setDragging(false); drag.current = null }
  function pointerDown(event: PointerEvent<HTMLElement>) {
    if (maximized || window.innerWidth < 768 || event.button !== 0 || (event.target as HTMLElement).closest('button,a,input')) return
    const rect = frame.current?.getBoundingClientRect()
    if (!rect) return
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, width: rect.width, pointer: event.pointerId }
    setPosition(constrain(rect.left, rect.top, rect.width)); setDragging(true)
  }
  function pointerMove(event: PointerEvent<HTMLElement>) {
    const start = drag.current
    if (!start || event.pointerId !== start.pointer) return
    setPosition(constrain(start.left + event.clientX - start.x, start.top + event.clientY - start.y, start.width))
  }
  function pointerUp(event: PointerEvent<HTMLElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    drag.current = null; setDragging(false)
  }
  function keyDown(event: KeyboardEvent<HTMLElement>) {
    if (!event.altKey || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key) || maximized || window.innerWidth < 768) return
    const rect = frame.current?.getBoundingClientRect()
    if (!rect) return
    event.preventDefault()
    setPosition(constrain(rect.left + (event.key === 'ArrowLeft' ? -20 : event.key === 'ArrowRight' ? 20 : 0), rect.top + (event.key === 'ArrowUp' ? -20 : event.key === 'ArrowDown' ? 20 : 0), rect.width))
  }
  const style: CSSProperties | undefined = position && !maximized ? { position: 'fixed', left: position.x, top: position.y, width: position.width, maxHeight: `calc(100dvh - ${position.y + 75}px)`, margin: 0, zIndex: 3 } : undefined
  return { frame, maximized, toggleMaximized: () => setMaximized(value => !value), visible, minimized, minimizing, dragging, floating: !!position && !maximized, style, restore, minimize, close, pointerDown, pointerMove, pointerUp, keyDown }
}
