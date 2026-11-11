import { useEffect, useState } from 'react'
import './DroneConflict.css'

type Point = [number, number]

const LOOP_MS = 7000
const FLY_MS = 6000
const LAG = 8.4 / 260 // D2 trails D1 slightly, so they pass 4.2 m apart instead of colliding
const M_PER_UNIT = 0.5
const MIN_SEP = 40 // 20 m; each ring is half the separation, so rings touch exactly at the limit
const A0: Point = [30, 142], A1: Point = [290, 58]
const B0: Point = [30, 58], B1: Point = [290, 142]
const CROSS: Point = [160, 100]
const CLOSEST = 0.5 + LAG / 2
const D1 = '#6fd3ff', D2 = '#b48ce0'
const STATE_COLOR = { clear: '#5fbf8f', warn: '#f0b64a', conflict: '#ff3b55' }

const clamp01 = (u: number) => Math.max(0, Math.min(1, u))
const lerp = (p: Point, q: Point, u: number): Point => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u]
const heading = (p: Point, q: Point) => Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI

function useProgress() {
  const [u, setU] = useState(CLOSEST)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const start = performance.now()
    let frame = requestAnimationFrame(function step(now) {
      setU(((now - start) % LOOP_MS) / FLY_MS)
      frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [])
  return u
}

function Drone({ at, angle, color }: { at: Point; angle: number; color: string }) {
  const rotors: Point[] = [[8, 8], [8, -8], [-8, 8], [-8, -8]]
  return <g transform={`translate(${at[0]} ${at[1]}) rotate(${angle})`}>
    {rotors.map(([x, y]) => <line key={`${x}${y}`} x1="0" y1="0" x2={x} y2={y} stroke="#3a3238" strokeWidth="2.4" strokeLinecap="round"/>)}
    {rotors.map(([x, y]) => <g key={`r${x}${y}`} transform={`translate(${x} ${y})`}>
      <circle r="5.4" fill={color} fillOpacity=".14" stroke={color} strokeOpacity=".7" strokeWidth=".7"/>
      <g className="dcs-blade"><line x1="-4.6" y1="0" x2="4.6" y2="0"/><line x1="0" y1="-1" x2="0" y2="1"/></g>
    </g>)}
    <rect x="-5.5" y="-4" width="11" height="8" rx="2.2" fill="#161216" stroke={color} strokeWidth="1"/>
    <path d="M5.5 -2.4 L9 0 L5.5 2.4 Z" fill={color}/>
    <circle className="dcs-led" cx="-2.6" cy="0" r="1.2" fill={color}/>
  </g>
}

export function DroneConflictScene() {
  const u = useProgress()
  const ua = clamp01(u), ub = clamp01(u - LAG)
  const a = lerp(A0, A1, ua), b = lerp(B0, B1, ub)
  const d = Math.hypot(a[0] - b[0], a[1] - b[1])
  const state = d < MIN_SEP ? 'conflict' : d < MIN_SEP * 1.8 ? 'warn' : 'clear'
  const c = STATE_COLOR[state]
  const fade = u > 1 ? Math.max(0, 1 - (u - 1) * 6) : Math.min(1, u * 12 + 0.2)
  const mid: Point = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const label = { conflict: 'CONFLICT', warn: 'WARNING', clear: 'CLEAR' }[state]

  return <svg className={`dcs dcs-${state}`} viewBox="0 0 320 200" role="img" aria-label="Two drones on crossing flight paths. Their separation rings overlap and the conflict alert fires as they pass 4.2 metres apart, under the 20 metre minimum">
    <defs>
      <pattern id="dcs-grid" width="16" height="16" patternUnits="userSpaceOnUse"><path d="M16 0H0V16" fill="none" stroke="#17121a" strokeWidth="1"/></pattern>
      <radialGradient id="dcs-glow"><stop offset="0" stopColor="#ff3b55" stopOpacity=".35"/><stop offset="1" stopColor="#ff3b55" stopOpacity="0"/></radialGradient>
      <linearGradient id="dcs-sweep" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#ff5a6e" stopOpacity="0"/><stop offset="1" stopColor="#ff5a6e" stopOpacity=".16"/></linearGradient>
    </defs>
    <rect width="320" height="200" fill="#09080a"/><rect width="320" height="200" fill="url(#dcs-grid)"/>
    {[38, 70, 102].map(r => <circle key={r} cx={CROSS[0]} cy={CROSS[1]} r={r} fill="none" stroke="#221a20" strokeWidth=".8"/>)}
    <g className="dcs-sweep"><path d={`M${CROSS[0]} ${CROSS[1]} L${CROSS[0] + 110} ${CROSS[1]} A110 110 0 0 0 ${CROSS[0] + 95} ${CROSS[1] - 55} Z`} fill="url(#dcs-sweep)"/></g>

    <line x1={A0[0]} y1={A0[1]} x2={A1[0]} y2={A1[1]} stroke={D1} strokeOpacity=".35" strokeWidth="1" strokeDasharray="3 4"/>
    <line x1={B0[0]} y1={B0[1]} x2={B1[0]} y2={B1[1]} stroke={D2} strokeOpacity=".35" strokeWidth="1" strokeDasharray="3 4"/>

    <g className="dcs-target" transform={`translate(${CROSS[0]} ${CROSS[1]})`}>
      <circle r="7" fill="none" stroke="#ff3b55" strokeWidth="1.1"/>
      <path d="M-12 0H-8M8 0H12M0 -12V-8M0 8V12" stroke="#ff3b55" strokeWidth="1.1"/>
    </g>

    <g opacity={fade}>
      <line x1={A0[0]} y1={A0[1]} x2={a[0]} y2={a[1]} stroke={D1} strokeWidth="1.6"/>
      <line x1={B0[0]} y1={B0[1]} x2={b[0]} y2={b[1]} stroke={D2} strokeWidth="1.6"/>
      {state === 'conflict' && <circle cx={mid[0]} cy={mid[1]} r="46" fill="url(#dcs-glow)"/>}
      <circle cx={a[0]} cy={a[1]} r={MIN_SEP / 2} fill={state === 'clear' ? D1 : c} fillOpacity=".1" stroke={state === 'clear' ? D1 : c} strokeOpacity=".8" strokeWidth="1" strokeDasharray={state === 'clear' ? '2 3' : undefined}/>
      <circle cx={b[0]} cy={b[1]} r={MIN_SEP / 2} fill={state === 'clear' ? D2 : c} fillOpacity=".1" stroke={state === 'clear' ? D2 : c} strokeOpacity=".8" strokeWidth="1" strokeDasharray={state === 'clear' ? '2 3' : undefined}/>
      {state !== 'clear' && <line className="dcs-link" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth="1.2"/>}
      <Drone at={a} angle={heading(A0, A1)} color={D1}/>
      <Drone at={b} angle={heading(B0, B1)} color={D2}/>
      <text className="dcs-id" x={a[0]} y={a[1] + 31} fill={D1}>D1</text>
      <text className="dcs-id" x={b[0]} y={b[1] - 25} fill={D2}>D2</text>
    </g>

    <path d="M6 18V6H18M302 6H314V18M314 182V194H302M18 194H6V182" fill="none" stroke="#5a3a47" strokeWidth="1.2"/>
    <text className="dcs-hud" x="14" y="17">SEPARATION CHECK</text>
    <text className="dcs-hud dcs-dim" x="14" y="27">MIN 20 m · 2 DRONES · 2 LEGS</text>
    <g className="dcs-pill" transform="translate(250 9)">
      <rect width="62" height="17" rx="8.5" fill={state === 'conflict' ? '#ff3b55' : '#120f12'} stroke={c}/>
      <text x="31" y="12" fill={state === 'conflict' ? '#fff' : c}>{label}</text>
    </g>
    <rect x="105" y="162" width="110" height="30" rx="3" fill="#0d0b0d" stroke={state === 'clear' ? '#2c2026' : c} strokeOpacity=".8"/>
    <text className="dcs-hud dcs-dim" x="111" y="173">D1 LEG 0 ↔ D2 LEG 0</text>
    <text className="dcs-big" x="111" y="187" fill={c}>{(d * M_PER_UNIT).toFixed(1)} m</text>
    {state === 'conflict' && <rect className="dcs-edge" x="1.5" y="1.5" width="317" height="197" rx="3" fill="none" stroke="#ff3b55" strokeWidth="3"/>}
  </svg>
}
