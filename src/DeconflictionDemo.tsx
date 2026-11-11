import { useMemo, useState } from 'react'
import './DeconflictionDemo.css'

type Point = [number, number]
type Segment = { drone: number; index: number; p1: Point; p2: Point }
type Conflict = { a: Segment; b: Segment; pa: Point; pb: Point; distance: number }
type Result = { conflicts: Conflict[]; checks: number }

const COLORS = ['#ff5a6e', '#7fb0d9', '#5fbf8f', '#e0b04a', '#b48ce0', '#e88a5a']
const SIZE = 200

// Port of gnc/src/deconfliction.py, in local east/north metres.
function orientation(a: Point, b: Point, c: Point) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
}

function closestOnSegment(p: Point, a: Point, b: Point): Point {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const lengthSq = dx * dx + dy * dy
  if (lengthSq === 0) return a
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSq))
  return [a[0] + t * dx, a[1] + t * dy]
}

const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1])

function closestPoints(p1: Point, p2: Point, q1: Point, q2: Point): [Point, Point] {
  const candidates: [Point, Point][] = [
    [p1, closestOnSegment(p1, q1, q2)],
    [p2, closestOnSegment(p2, q1, q2)],
    [closestOnSegment(q1, p1, p2), q1],
    [closestOnSegment(q2, p1, p2), q2],
  ]
  const d1 = orientation(q1, q2, p1), d2 = orientation(q1, q2, p2)
  const d3 = orientation(p1, p2, q1), d4 = orientation(p1, p2, q2)
  if (d1 * d2 < 0 && d3 * d4 < 0) {
    const t = d1 / (d1 - d2)
    const crossing: Point = [p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])]
    candidates.push([crossing, closestOnSegment(crossing, q1, q2)])
  }
  return candidates.reduce((best, pair) => dist(...pair) < dist(...best) ? pair : best)
}

function toSegments(paths: Point[][]): Segment[] {
  return paths.flatMap((points, drone) => points.length === 1
    ? [{ drone, index: 0, p1: points[0], p2: points[0] }]
    : points.slice(1).map((p2, index) => ({ drone, index, p1: points[index], p2 })))
}

function bruteForce(segments: Segment[], minSep: number): Result {
  const conflicts: Conflict[] = []
  let checks = 0
  segments.forEach((a, i) => segments.slice(i + 1).forEach(b => {
    if (a.drone === b.drone) return
    checks++
    const [pa, pb] = closestPoints(a.p1, a.p2, b.p1, b.p2)
    const distance = dist(pa, pb)
    if (distance < minSep) conflicts.push({ a, b, pa, pb, distance })
  }))
  return { conflicts, checks }
}

function sweepAndPrune(segments: Segment[], minSep: number): Result {
  const entries = segments.map(s => ({
    s,
    minX: Math.min(s.p1[0], s.p2[0]), maxX: Math.max(s.p1[0], s.p2[0]),
    minY: Math.min(s.p1[1], s.p2[1]), maxY: Math.max(s.p1[1], s.p2[1]),
  })).sort((a, b) => a.minX - b.minX)
  const conflicts: Conflict[] = []
  let checks = 0
  let active: typeof entries = []
  for (const e of entries) {
    active = active.filter(o => o.maxX + minSep > e.minX)
    for (const o of active) {
      if (o.s.drone === e.s.drone) continue
      if (o.minY - e.maxY >= minSep || e.minY - o.maxY >= minSep) continue
      checks++
      const [pa, pb] = closestPoints(o.s.p1, o.s.p2, e.s.p1, e.s.p2)
      const distance = dist(pa, pb)
      if (distance < minSep) conflicts.push({ a: o.s, b: e.s, pa, pb, distance })
    }
    active.push(e)
  }
  return { conflicts, checks }
}

const key = (c: Conflict) => [`${c.a.drone}:${c.a.index}`, `${c.b.drone}:${c.b.index}`].sort().join('|')

function randomPaths(seed: number): Point[][] {
  let s = seed >>> 0
  const rand = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const drones = 3 + Math.floor(rand() * 4)
  return Array.from({ length: drones }, () => Array.from({ length: 1 + Math.floor(rand() * 5) }, (): Point => [10 + rand() * 180, 10 + rand() * 180]))
}

const PRESETS: { name: string; note: string; paths: Point[][] }[] = [
  { name: 'Crossing', note: 'D1 and D2 cross in the middle, so they come within 0 m of each other.', paths: [[[20, 20], [180, 180]], [[20, 180], [180, 20]], [[150, 100], [190, 60]]] },
  { name: 'Near miss', note: 'D1 and D2 fly parallel 6 m apart. They never cross, but they are too close at a 10 m separation.', paths: [[[20, 90], [180, 90]], [[20, 96], [180, 96]], [[40, 150], [160, 150]]] },
  { name: 'Hovering', note: 'D1 has no setpoints left, so it hovers. D2 flies 4 m past it.', paths: [[[100, 104]], [[20, 100], [180, 100]], [[100, 20], [100, 60]]] },
  { name: 'Shared boundary', note: 'D1 and D2 fly along the same line and overlap for 40 m.', paths: [[[100, 20], [100, 120]], [[100, 80], [100, 190]], [[30, 40], [60, 170]]] },
  { name: 'Far apart', note: 'Only D1 and D2 are close. Sweep and prune never compares the drones on the right with them.', paths: [[[10, 20], [60, 20], [70, 60]], [[20, 27], [50, 27]], [[150, 150], [190, 190], [160, 120]], [[150, 60], [190, 20]], [[120, 180], [140, 130]]] },
]

export function DeconflictionDemo() {
  const [preset, setPreset] = useState(0)
  const [seed, setSeed] = useState(7)
  const [minSep, setMinSep] = useState(10)
  const isRandom = preset === PRESETS.length
  const paths = useMemo(() => isRandom ? randomPaths(seed) : PRESETS[preset].paths, [isRandom, preset, seed])
  const segments = useMemo(() => toSegments(paths), [paths])
  const brute = useMemo(() => bruteForce(segments, minSep), [segments, minSep])
  const sweep = useMemo(() => sweepAndPrune(segments, minSep), [segments, minSep])
  const same = brute.conflicts.map(key).sort().join() === sweep.conflicts.map(key).sort().join()
  const conflicting = new Set(brute.conflicts.flatMap(c => [`${c.a.drone}:${c.a.index}`, `${c.b.drone}:${c.b.index}`]))
  const y = (north: number) => SIZE - north

  return <div className="dc-demo">
    <div className="dc-head">
      <div className="dc-presets" role="group" aria-label="Scenario">
        {PRESETS.map((p, i) => <button key={p.name} className={preset === i ? 'dc-on' : ''} aria-pressed={preset === i} onClick={() => setPreset(i)}>{p.name}</button>)}
        <button className={isRandom ? 'dc-on' : ''} aria-pressed={isRandom} onClick={() => { setPreset(PRESETS.length); setSeed(n => n + 1) }}>{isRandom ? 'New random' : 'Random'}</button>
      </div>
      <label className="dc-sep">Minimum separation <strong>{minSep} m</strong>
        <input type="range" min="2" max="30" value={minSep} onChange={e => setMinSep(Number(e.target.value))}/>
      </label>
    </div>

    <div className="dc-body">
      <svg className="dc-map" viewBox={`-6 -6 ${SIZE + 12} ${SIZE + 12}`} role="img" aria-label={`${paths.length} drone flight paths with ${brute.conflicts.length} conflicts at ${minSep} metres separation`}>
        <defs><pattern id="dc-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#1d1619" strokeWidth=".6"/></pattern></defs>
        <rect x="0" y="0" width={SIZE} height={SIZE} fill="url(#dc-grid)" stroke="#2c2026" strokeWidth=".8"/>
        {segments.map(s => <line key={`b${s.drone}:${s.index}`} className="dc-buffer" x1={s.p1[0]} y1={y(s.p1[1])} x2={s.p2[0]} y2={y(s.p2[1])} stroke={COLORS[s.drone % COLORS.length]} strokeWidth={minSep}/>)}
        {segments.map(s => <line key={`l${s.drone}:${s.index}`} x1={s.p1[0]} y1={y(s.p1[1])} x2={s.p2[0]} y2={y(s.p2[1])} stroke={COLORS[s.drone % COLORS.length]} strokeWidth={conflicting.has(`${s.drone}:${s.index}`) ? 2.4 : 1.3} strokeLinecap="round"/>)}
        {paths.map((points, d) => <g key={d} fill={COLORS[d % COLORS.length]}>
          {points.map((p, i) => <circle key={i} cx={p[0]} cy={y(p[1])} r={i === 0 ? 3.4 : 1.8}/>)}
          {points.length === 1 && <circle cx={points[0][0]} cy={y(points[0][1])} r="6" fill="none" stroke={COLORS[d % COLORS.length]} strokeDasharray="2 2"/>}
          <text className="dc-label" x={points[0][0] + 5} y={y(points[0][1]) - 5}>D{d + 1}</text>
        </g>)}
        {brute.conflicts.map(c => <g key={key(c)} className="dc-hit">
          <line x1={c.pa[0]} y1={y(c.pa[1])} x2={c.pb[0]} y2={y(c.pb[1])}/>
          <circle cx={(c.pa[0] + c.pb[0]) / 2} cy={y((c.pa[1] + c.pb[1]) / 2)} r="4.5"/>
        </g>)}
      </svg>

      <div className="dc-side">
        <p className="dc-note">{isRandom ? 'Random scenario: 3 to 6 drones with 1 to 5 setpoints each, the same ranges the cross-check test uses.' : PRESETS[preset].note}</p>
        <div className="dc-stats">
          <div><span>Brute force</span><strong>{brute.checks}</strong><small>leg pairs compared</small></div>
          <div><span>Sweep and prune</span><strong>{sweep.checks}</strong><small>leg pairs compared</small></div>
        </div>
        <p className={`dc-match${same ? '' : ' dc-bad'}`}>{same ? `Both found the same ${brute.conflicts.length} conflict${brute.conflicts.length === 1 ? '' : 's'}` : 'Results differ'}</p>
        <ul className="dc-list" aria-live="polite">
          {brute.conflicts.length === 0 && <li className="dc-clear">No legs within {minSep} m. All drones are clear.</li>}
          {brute.conflicts.map(c => <li key={key(c)}><span>D{c.a.drone + 1} leg {c.a.index}</span><span>D{c.b.drone + 1} leg {c.b.index}</span><strong>{c.distance.toFixed(1)} m</strong></li>)}
        </ul>
        <small className="dc-legend">Large dots are each drone's current position. Shaded bands are half the separation on each side of a leg, so two bands overlap exactly when the legs conflict. Legs are numbered from 0, the leg leaving the current position.</small>
      </div>
    </div>
  </div>
}
