import { useEffect, useRef, useState, type MouseEvent } from 'react'
import './NavDemo.css'

// Arena and parameters from the WATonomous assignment (robot_env.sdf + the four nodes)
const ARENA = 15             // walls at ±15 m
const RES = 0.2              // demo grid; the real nodes use 0.1 m
const N = (2 * ARENA) / RES  // 150 × 150 cells
const INSCRIBED = 0.4, INFLATION = 0.65
const LOOKAHEAD = 1.1, SPEED = 0.65, DT = 0.1
const BEAMS = 256, MAX_RANGE = 20, LOCAL_HALF = 15
const MAP_UPDATE_DIST = 1.5, GOAL_TOLERANCE = 0.5
const SIM_SPEED = 4
const GOALS: [number, number][] = [[10, -11], [11, 11], [-11, 11], [-11, -11]]

type Shape = { kind: 'box'; x: number; y: number; w: number; h: number } | { kind: 'cyl'; x: number; y: number; r: number }
const SHAPES: Shape[] = [
  { kind: 'box', x: 7, y: -6, w: 3, h: 3 }, { kind: 'box', x: -8, y: 6, w: 3, h: 3 }, { kind: 'box', x: 4, y: 9, w: 3, h: 3 },
  { kind: 'box', x: 9, y: 3, w: 2, h: 2 }, { kind: 'box', x: 1, y: -10, w: 2, h: 2 },
  { kind: 'cyl', x: 0, y: 0, r: 3 }, { kind: 'cyl', x: -7, y: -7, r: 2 },
]

function solid(x: number, y: number) {
  if (Math.abs(x) >= ARENA - 0.25 || Math.abs(y) >= ARENA - 0.25) return true
  for (const s of SHAPES) {
    if (s.kind === 'box' ? Math.abs(x - s.x) <= s.w / 2 && Math.abs(y - s.y) <= s.h / 2 : (x - s.x) ** 2 + (y - s.y) ** 2 <= s.r * s.r) return true
  }
  return false
}

// The drawn robot is 2 m long and 1 m wide. Its enclosing circle
// keeps the entire body clear, including while turning in place.
const BODY_RADIUS = Math.hypot(1, 0.5)
function bodyBlocked(x: number, y: number, radius = BODY_RADIUS) {
  if (Math.abs(x) + radius >= ARENA - 0.25 || Math.abs(y) + radius >= ARENA - 0.25) return true
  return SHAPES.some(s => {
    if (s.kind === 'cyl') return Math.hypot(x - s.x, y - s.y) <= s.r + radius
    const dx = Math.max(0, Math.abs(x - s.x) - s.w / 2)
    const dy = Math.max(0, Math.abs(y - s.y) - s.h / 2)
    return Math.hypot(dx, dy) <= BODY_RADIUS
  })
}
function motionBlocked(x: number, y: number, nx: number, ny: number) {
  const steps = Math.max(1, Math.ceil(Math.hypot(nx - x, ny - y) / 0.025))
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    if (bodyBlocked(x + (nx - x) * t, y + (ny - y) * t)) return true
  }
  return false
}

type Pt = [number, number]
type Sim = {
  x: number; y: number; yaw: number; v: number; w: number
  map: Int8Array; mapDirty: boolean
  lastX: number; lastY: number; updateFlag: boolean
  goal: Pt | null; goalIndex: number; manual: boolean; waitSteps: number
  path: Pt[]; expanded: number; noPath: boolean; lookahead: Pt | null
  steps: number; mapUpdates: number; trail: Pt[]
}

const toCell = (v: number) => Math.floor((v + ARENA) / RES)

// Include a half-cell diagonal so every point in a traversable cell
// clears the body; this also makes adjacent-cell transitions safe.
const bodyGrid = new Uint8Array(N * N)
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
  bodyGrid[y * N + x] = Number(bodyBlocked(x * RES - ARENA + RES / 2, y * RES - ARENA + RES / 2, BODY_RADIUS + RES / Math.SQRT2))
}

// LiDAR: 256 beams over 360°, 20 m range
function scan(sim: Sim) {
  const hits: Pt[] = []
  for (let i = 0; i < BEAMS; i++) {
    const a = sim.yaw - Math.PI + (i * 2 * Math.PI) / BEAMS
    const c = Math.cos(a), s = Math.sin(a)
    for (let r = 0.1; r <= MAX_RANGE; r += 0.05) {
      const hx = sim.x + c * r, hy = sim.y + s * r
      if (solid(hx, hy)) { hits.push([hx, hy]); break }
    }
  }
  return hits
}

// costmap + map_memory: mark hits, inflate with the same decay, keep the max cost
function integrate(sim: Sim, hits: Pt[]) {
  const cells = Math.floor(INFLATION / RES)
  for (const [hx, hy] of hits) {
    if (Math.abs(hx - sim.x) >= LOCAL_HALF || Math.abs(hy - sim.y) >= LOCAL_HALF) continue
    const gx = toCell(hx), gy = toCell(hy)
    for (let dx = -cells; dx <= cells; dx++) for (let dy = -cells; dy <= cells; dy++) {
      const nx = gx + dx, ny = gy + dy
      if (nx < 0 || nx >= N || ny < 0 || ny >= N) continue
      const d = Math.hypot(dx, dy) * RES
      const cost = d <= INSCRIBED ? 100 : d <= INFLATION ? Math.trunc(99 * (1 - (d - INSCRIBED) / (INFLATION - INSCRIBED))) : 0
      const i = ny * N + nx
      if (cost > sim.map[i]) sim.map[i] = cost
    }
  }
  sim.mapDirty = true
  sim.mapUpdates++
}

class Heap {
  f: number[] = []; v: number[] = []; g: number[] = []
  get size() { return this.f.length }
  push(f: number, v: number, g: number) {
    let i = this.f.length
    this.f.push(f); this.v.push(v); this.g.push(g)
    while (i > 0) { const p = (i - 1) >> 1; if (this.f[p] <= this.f[i]) break; this.swap(i, p); i = p }
  }
  pop(): [number, number] {
    const top: [number, number] = [this.v[0], this.g[0]]
    const lf = this.f.pop()!, lv = this.v.pop()!, lg = this.g.pop()!
    if (this.f.length) {
      this.f[0] = lf; this.v[0] = lv; this.g[0] = lg
      for (let i = 0; ;) {
        const l = 2 * i + 1, r = l + 1
        let m = i
        if (l < this.f.length && this.f[l] < this.f[m]) m = l
        if (r < this.f.length && this.f[r] < this.f[m]) m = r
        if (m === i) break
        this.swap(i, m); i = m
      }
    }
    return top
  }
  swap(a: number, b: number) {
    [this.f[a], this.f[b]] = [this.f[b], this.f[a]];
    [this.v[a], this.v[b]] = [this.v[b], this.v[a]];
    [this.g[a], this.g[b]] = [this.g[b], this.g[a]]
  }
}

const DX = [-1, 0, 1, -1, 1, -1, 0, 1], DY = [-1, -1, -1, 0, 0, 1, 1, 1]

// planner: eight-direction A* with the planner node's cost rules and cubic penalty
function plan(sim: Sim) {
  if (!sim.goal) return
  const sx = toCell(sim.x), sy = toCell(sim.y), gx = toCell(sim.goal[0]), gy = toCell(sim.goal[1])
  const inside = (x: number, y: number) => x >= 0 && x < N && y >= 0 && y < N
  if (!inside(sx, sy) || !inside(gx, gy) || bodyBlocked(sim.goal[0], sim.goal[1])) { sim.noPath = true; sim.path = []; return }
  const start = sy * N + sx, goal = gy * N + gx
  const h = (x: number, y: number) => Math.hypot(x - gx, y - gy)
  const g = new Float64Array(N * N).fill(Infinity)
  const came = new Int32Array(N * N).fill(-1)
  const open = new Heap()
  g[start] = 0
  open.push(h(sx, sy), start, 0)
  let expanded = 0, found = false
  while (open.size) {
    const [cur, cg] = open.pop()
    if (cg > g[cur]) continue
    expanded++
    if (cur === goal) { found = true; break }
    const cx = cur % N, cy = (cur - cx) / N
    const currentCost = Math.max(0, sim.map[cur])
    for (let k = 0; k < 8; k++) {
      const nx = cx + DX[k], ny = cy + DY[k]
      if (!inside(nx, ny)) continue
      const wx = nx * RES - ARENA + RES / 2, wy = ny * RES - ARENA + RES / 2
      const fromX = cur === start ? sim.x : cx * RES - ARENA + RES / 2
      const fromY = cur === start ? sim.y : cy * RES - ARENA + RES / 2
      if (bodyGrid[ny * N + nx] || (cur === start && motionBlocked(fromX, fromY, wx, wy))) continue
      // Do not cut diagonally between two lethal map cells.
      if (DX[k] && DY[k] && (sim.map[cy * N + nx] >= 100 || sim.map[ny * N + cx] >= 100)) continue
      const ni = ny * N + nx
      const cost = Math.max(0, sim.map[ni])
      if (cost >= 100) { if (currentCost < 100) continue }
      else if (cost > 60) { if (currentCost <= 60 || cost > currentCost) continue }
      const penalty = cost > 0 ? (cost / 100) ** 3 * 250 : 0
      const tg = g[cur] + (DX[k] && DY[k] ? Math.SQRT2 : 1) + penalty
      if (tg < g[ni]) { g[ni] = tg; came[ni] = cur; open.push(tg + h(nx, ny), ni, tg) }
    }
  }
  sim.expanded = expanded
  sim.noPath = !found
  if (!found) { sim.path = []; return }
  const path: Pt[] = []
  for (let c = goal; c !== start && c !== -1; c = came[c]) path.push([(c % N) * RES - ARENA + RES / 2, Math.floor(c / N) * RES - ARENA + RES / 2])
  sim.path = path.reverse()
}

// control: Pure Pursuit, 1.1 m lookahead, 0.65 m/s, angular speed clamped to ±1 rad/s
function control(sim: Sim) {
  sim.lookahead = null
  sim.v = 0; sim.w = 0
  if (!sim.path.length) return
  let target = sim.path.find(p => Math.hypot(p[0] - sim.x, p[1] - sim.y) >= LOOKAHEAD)
  if (!target) {
    target = sim.path[sim.path.length - 1]
    if (Math.hypot(target[0] - sim.x, target[1] - sim.y) < 0.2) { sim.path = []; return }
  }
  const dx = target[0] - sim.x, dy = target[1] - sim.y
  const lx = dx * Math.cos(-sim.yaw) - dy * Math.sin(-sim.yaw)
  const ly = dx * Math.sin(-sim.yaw) + dy * Math.cos(-sim.yaw)
  const l2 = lx * lx + ly * ly
  const headingError = Math.atan2(ly, lx)
  if (Math.abs(headingError) > 0.4) {
    sim.w = Math.max(-1, Math.min(1, headingError * 2))
  } else if (l2 > 0.001) {
    sim.v = SPEED
    sim.w = Math.max(-1, Math.min(1, SPEED * (2 * ly / l2)))
  }
  sim.lookahead = target
}

function createSim(): Sim {
  const sim: Sim = {
    x: -6, y: 0, yaw: 0, v: 0, w: 0,
    map: new Int8Array(N * N).fill(-1), mapDirty: true,
    lastX: -6, lastY: 0, updateFlag: false,
    goal: GOALS[0], goalIndex: 0, manual: false, waitSteps: 0,
    path: [], expanded: 0, noPath: false, lookahead: null,
    steps: 0, mapUpdates: 0, trail: [[-6, 0]],
  }
  integrate(sim, scan(sim))
  plan(sim)
  return sim
}

function step(sim: Sim) {
  sim.steps++
  // odometry callback: request a map merge after moving 1.5 m
  if (Math.hypot(sim.x - sim.lastX, sim.y - sim.lastY) >= MAP_UPDATE_DIST) { sim.lastX = sim.x; sim.lastY = sim.y; sim.updateFlag = true }
  let replan = sim.steps % 5 === 0
  // map_memory 1 s timer
  if (sim.steps % 10 === 0 && sim.updateFlag) { integrate(sim, scan(sim)); sim.updateFlag = false; replan = true }

  if (!sim.goal && sim.waitSteps > 0 && --sim.waitSteps === 0) { sim.goal = GOALS[sim.goalIndex]; replan = true }
  if (sim.goal) {
    if (Math.hypot(sim.goal[0] - sim.x, sim.goal[1] - sim.y) < GOAL_TOLERANCE) {
      if (!sim.manual) sim.goalIndex = (sim.goalIndex + 1) % GOALS.length
      sim.goal = null; sim.manual = false; sim.path = []; sim.noPath = false; sim.waitSteps = 15
    } else if (replan) plan(sim)
  }

  control(sim)
  const nx = sim.x + sim.v * Math.cos(sim.yaw) * DT
  const ny = sim.y + sim.v * Math.sin(sim.yaw) * DT
  if (sim.v > 0 && motionBlocked(sim.x, sim.y, nx, ny)) {
    // Pure Pursuit can round a safe A* corner into an obstacle. Stop
    // before committing the pose, refresh the map, and replan.
    sim.v = 0
    sim.w = 0
    integrate(sim, scan(sim))
    plan(sim)
  } else {
    sim.x = nx
    sim.y = ny
  }
  sim.yaw += sim.w * DT
  if (sim.steps % 3 === 0 && sim.v > 0) { sim.trail.push([sim.x, sim.y]); if (sim.trail.length > 900) sim.trail.shift() }
}

const SIZE = 600
const P = SIZE / (2 * ARENA)
const px = (x: number) => (x + ARENA) * P
const py = (y: number) => (ARENA - y) * P

function draw(ctx: CanvasRenderingContext2D, sim: Sim, mapCanvas: HTMLCanvasElement, mapCtx: CanvasRenderingContext2D, image: ImageData) {
  if (sim.mapDirty) {
    const d = image.data
    for (let cy = 0; cy < N; cy++) for (let cx = 0; cx < N; cx++) {
      const c = sim.map[cy * N + cx]
      const o = ((N - 1 - cy) * N + cx) * 4
      if (c >= 100) { d[o] = 255; d[o + 1] = 90; d[o + 2] = 110; d[o + 3] = 235 }
      else if (c > 0) { d[o] = 209; d[o + 1] = 75; d[o + 2] = 93; d[o + 3] = 40 + c * 1.6 }
      else d[o + 3] = 0
    }
    mapCtx.putImageData(image, 0, 0)
    sim.mapDirty = false
  }

  ctx.fillStyle = '#0b0b0c'
  ctx.fillRect(0, 0, SIZE, SIZE)
  ctx.strokeStyle = '#161216'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let m = -ARENA + 5; m < ARENA; m += 5) { ctx.moveTo(px(m), 0); ctx.lineTo(px(m), SIZE); ctx.moveTo(0, py(m)); ctx.lineTo(SIZE, py(m)) }
  ctx.stroke()

  // true obstacles, dashed, so you can see what the robot hasn't scanned yet
  ctx.setLineDash([4, 4])
  ctx.strokeStyle = '#3d2c34'
  for (const s of SHAPES) {
    ctx.beginPath()
    if (s.kind === 'box') ctx.rect(px(s.x - s.w / 2), py(s.y + s.h / 2), s.w * P, s.h * P)
    else ctx.arc(px(s.x), py(s.y), s.r * P, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.strokeRect(px(-ARENA + 0.25), py(ARENA - 0.25), (2 * ARENA - 0.5) * P, (2 * ARENA - 0.5) * P)
  ctx.setLineDash([])

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(mapCanvas, 0, 0, SIZE, SIZE)

  const hits = scan(sim)
  ctx.strokeStyle = 'rgba(127,182,255,0.07)'
  ctx.beginPath()
  for (const [hx, hy] of hits) { ctx.moveTo(px(sim.x), py(sim.y)); ctx.lineTo(px(hx), py(hy)) }
  ctx.stroke()
  ctx.fillStyle = '#8fd3ff'
  for (const [hx, hy] of hits) ctx.fillRect(px(hx) - 1, py(hy) - 1, 2, 2)

  if (sim.trail.length > 1) {
    ctx.strokeStyle = '#6f6268'
    ctx.setLineDash([3, 5])
    ctx.beginPath()
    sim.trail.forEach(([x, y], i) => i ? ctx.lineTo(px(x), py(y)) : ctx.moveTo(px(x), py(y)))
    ctx.lineTo(px(sim.x), py(sim.y))
    ctx.stroke()
    ctx.setLineDash([])
  }

  if (sim.path.length) {
    ctx.strokeStyle = '#f5b942'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(px(sim.x), py(sim.y))
    for (const [x, y] of sim.path) ctx.lineTo(px(x), py(y))
    ctx.stroke()
    ctx.lineWidth = 1
  }

  if (sim.goal) {
    const gx = px(sim.goal[0]), gy = py(sim.goal[1])
    ctx.strokeStyle = sim.noPath ? '#ff5a6e' : '#5fbf8f'
    ctx.setLineDash([3, 3])
    ctx.beginPath(); ctx.arc(gx, gy, GOAL_TOLERANCE * P, 0, Math.PI * 2); ctx.stroke()
    ctx.setLineDash([])
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(gx - 6, gy); ctx.lineTo(gx + 6, gy); ctx.moveTo(gx, gy - 6); ctx.lineTo(gx, gy + 6); ctx.stroke()
    ctx.lineWidth = 1
  }

  if (sim.lookahead) {
    ctx.strokeStyle = '#f5b942'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(px(sim.lookahead[0]), py(sim.lookahead[1]), 5, 0, Math.PI * 2); ctx.stroke()
    ctx.lineWidth = 1
  }

  ctx.save()
  ctx.translate(px(sim.x), py(sim.y))
  ctx.rotate(-sim.yaw)
  ctx.fillStyle = '#e8dde2'
  ctx.strokeStyle = '#0b0b0c'
  ctx.beginPath(); ctx.roundRect(-1 * P, -0.5 * P, 2 * P, 1 * P, 3); ctx.fill(); ctx.stroke()
  ctx.fillStyle = '#911e2b'
  ctx.beginPath(); ctx.moveTo(0.95 * P, 0); ctx.lineTo(0.35 * P, -0.32 * P); ctx.lineTo(0.35 * P, 0.32 * P); ctx.closePath(); ctx.fill()
  ctx.restore()
}

type Ui = { time: number; scans: number; mapUpdates: number; pathLen: number; expanded: number; v: number; w: number; goal: Pt | null; noPath: boolean }
const EMPTY_UI: Ui = { time: 0, scans: 0, mapUpdates: 0, pathLen: 0, expanded: 0, v: 0, w: 0, goal: GOALS[0], noPath: false }

function readUi(sim: Sim): Ui {
  let len = 0, x = sim.x, y = sim.y
  for (const p of sim.path) { len += Math.hypot(p[0] - x, p[1] - y); [x, y] = p }
  return { time: sim.steps * DT, scans: sim.steps + 1, mapUpdates: sim.mapUpdates, pathLen: len, expanded: sim.expanded, v: sim.v, w: sim.w, goal: sim.goal, noPath: sim.noPath }
}

function InflationProfile() {
  const x = (m: number) => 22 + (m / 0.8) * 168
  const y = (c: number) => 74 - c * 0.62
  return <svg className="nd-profile" viewBox="0 0 200 96" role="img" aria-label="Cost is 100 within 0.40 metres of an obstacle and falls linearly to 0 at 0.65 metres">
    <path d={`M${x(0)} ${y(0)} H${x(0.8)} M${x(0)} ${y(0)} V${y(100)}`} stroke="#3a2a31"/>
    <path d={`M${x(0)} ${y(100)} H${x(0.4)} L${x(0.65)} ${y(0)} H${x(0.8)}`} stroke="#ff5a6e" strokeWidth="2" fill="none"/>
    <path d={`M${x(0.4)} ${y(0)} V${y(100)} M${x(0.65)} ${y(0)} V${y(100)}`} stroke="#3a2a31" strokeDasharray="2 3"/>
    <text x={x(0) - 4} y={y(100) + 3} textAnchor="end">100</text><text x={x(0) - 4} y={y(0) + 3} textAnchor="end">0</text>
    <text x={x(0.4)} y="88" textAnchor="middle">0.40 m</text><text x={x(0.65)} y="88" textAnchor="middle">0.65 m</text>
    <text x={x(0.2)} y={y(100) - 5} textAnchor="middle" fill="#ff8a98">lethal</text>
    <text x={x(0.53)} y={y(100) - 5} textAnchor="middle" fill="#d14b5d">inflation</text>
  </svg>
}

export function NavDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const simRef = useRef<Sim | null>(null)
  const pausedRef = useRef(false)
  const [paused, setPaused] = useState(false)
  const [ui, setUi] = useState<Ui>(EMPTY_UI)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = canvas.height = SIZE * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const mapCanvas = document.createElement('canvas')
    mapCanvas.width = mapCanvas.height = N
    const mapCtx = mapCanvas.getContext('2d')!
    const image = mapCtx.createImageData(N, N)
    if (!simRef.current) simRef.current = createSim()

    let raf = 0, last = performance.now(), acc = 0, lastUi = 0
    const frame = (now: number) => {
      const sim = simRef.current!
      const elapsed = Math.min(0.1, (now - last) / 1000)
      last = now
      if (!pausedRef.current) { acc += elapsed * SIM_SPEED; while (acc >= DT) { step(sim); acc -= DT } }
      draw(ctx, sim, mapCanvas, mapCtx, image)
      if (now - lastUi > 200) { lastUi = now; setUi(readUi(sim)) }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  const sendGoal = (event: MouseEvent<HTMLCanvasElement>) => {
    const sim = simRef.current
    if (!sim) return
    const rect = event.currentTarget.getBoundingClientRect()
    const clamp = (v: number) => Math.max(-ARENA + 1, Math.min(ARENA - 1, v))
    sim.goal = [clamp(((event.clientX - rect.left) / rect.width) * 2 * ARENA - ARENA), clamp(ARENA - ((event.clientY - rect.top) / rect.height) * 2 * ARENA)]
    sim.manual = true
    sim.waitSteps = 0
    plan(sim)
  }
  const togglePause = () => { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current) }
  const restart = () => { simRef.current = createSim(); pausedRef.current = false; setPaused(false) }

  const status = ui.noPath ? "A* couldn't find a path!" : ui.goal ? `Driving to goal (${ui.goal[0].toFixed(1)}, ${ui.goal[1].toFixed(1)})` : 'Goal reached, next goal soon'

  return <div className="nd-demo">
    <div className="nd-head">
      <div><strong>Navigation pipeline simulation</strong><span className="nd-clock">t = {ui.time.toFixed(1)} s · {SIM_SPEED}× speed</span></div>
      <div className="nd-actions">
        <button className="nd-play" onClick={togglePause}>{paused ? 'Play' : 'Pause'}</button>
        <button className="nd-reset" onClick={restart}>Restart</button>
      </div>
    </div>

    <div className="nd-body">
      <div className="nd-stage">
        <canvas ref={canvasRef} className="nd-canvas" onClick={sendGoal} aria-label="Top-down map of the arena. Click to send the robot a goal"/>
        <div className="nd-hint">Click the map to send a goal</div>
        <div className="nd-legend">
          <span><i className="nd-sw nd-sw-lethal"/>Lethal (100)</span>
          <span><i className="nd-sw nd-sw-inflate"/>Inflation (1–99)</span>
          <span><i className="nd-sw nd-sw-true"/>Not scanned yet</span>
          <span><i className="nd-sw nd-sw-lidar"/>LiDAR hits</span>
          <span><i className="nd-sw nd-sw-path"/>A* path</span>
          <span><i className="nd-sw nd-sw-goal"/>Goal (0.5 m)</span>
        </div>
      </div>

      <div className="nd-side">
        <div className={`nd-status${ui.noPath ? ' nd-bad' : ''}`}>{status}</div>
        <ol className="nd-nodes">
          <li><b>costmap</b><code>/lidar → /costmap</code><span>{ui.scans} scans · 256 beams at 10 Hz</span></li>
          <li><b>map_memory</b><code>/costmap → /map</code><span>{ui.mapUpdates} merges · one per 1.5 m moved</span></li>
          <li><b>planner</b><code>/map → /path</code><span>{ui.noPath ? 'no path found' : `${ui.pathLen.toFixed(1)} m path · ${ui.expanded.toLocaleString()} cells expanded`}</span></li>
          <li><b>control</b><code>/path → /cmd_vel</code><span>v {ui.v.toFixed(2)} m/s · ω {ui.w >= 0 ? '+' : ''}{ui.w.toFixed(2)} rad/s</span></li>
        </ol>
        <div className="nd-card">
          <span className="nd-cap">Obstacle inflation</span>
          <InflationProfile/>
        </div>
        <div className="nd-card nd-facts">
          <div><b>A*</b><span>8 directions, cost penalty (c/100)³ × 250</span></div>
          <div><b>Pure Pursuit</b><span>1.1 m lookahead at 0.65 m/s, ω ≤ 1 rad/s</span></div>
        </div>
      </div>
    </div>
  </div>
}

// Static card cover: the robot partway along its A* route through the inflated map
export function NavCover() {
  const robot: Pt = [98, 138]
  const rays: Pt[] = [[100, 118], [88, 113.5], [112, 113.5], [102, 154], [108, 154], [133, 133], [133, 141], [70, 142], [90, 190], [120, 190], [150, 190], [190, 160], [10, 120], [10, 160]]
  const chips = [['/lidar', '256 beams'], ['/costmap', '0.65 m inflation'], ['/map', '100 × 100 m grid'], ['/path', 'A*, 8 directions'], ['/cmd_vel', 'Pure Pursuit']]
  return <svg className="nav-cover" viewBox="0 0 320 200" role="img" aria-label="Robot following an A* path around inflated obstacles, with LiDAR rays and the four-node pipeline">
    <rect width="320" height="200" fill="#0c0b0c"/>
    <g stroke="#161216">{[40, 70, 100, 130, 160].map(v => <path key={v} d={`M${v} 10V190M10 ${v}H190`}/>)}</g>
    <g className="nc-inflate">
      <rect x="129" y="123" width="26" height="26" rx="4"/><rect x="39" y="51" width="26" height="26" rx="4"/><rect x="111" y="33" width="26" height="26" rx="4"/>
      <rect x="144" y="72" width="20" height="20" rx="4"/><rect x="96" y="150" width="20" height="20" rx="4"/>
      <circle cx="100" cy="100" r="22"/><circle cx="58" cy="142" r="16"/>
    </g>
    <g className="nc-lethal">
      <rect x="133" y="127" width="18" height="18"/><rect x="43" y="55" width="18" height="18"/><rect x="115" y="37" width="18" height="18"/>
      <rect x="148" y="76" width="12" height="12"/><rect x="100" y="154" width="12" height="12"/>
      <circle cx="100" cy="100" r="18"/><circle cx="58" cy="142" r="12"/>
    </g>
    <rect x="10" y="10" width="180" height="180" fill="none" stroke="#ff5a6e" strokeWidth="2.5"/>
    <g stroke="rgba(127,182,255,0.28)">{rays.map(([x, y], i) => <path key={i} d={`M${robot[0]} ${robot[1]}L${x} ${y}`}/>)}</g>
    <g fill="#8fd3ff">{rays.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.4"/>)}</g>
    <path d="M64 100 C66 115, 78 133, 98 138" fill="none" stroke="#6f6268" strokeWidth="1.5" strokeDasharray="3 4"/>
    <path d="M98 138 C112 142, 128 150, 142 157 S 156 164, 160 166" fill="none" stroke="#f5b942" strokeWidth="2.2"/>
    <circle cx="160" cy="166" r="4" fill="none" stroke="#5fbf8f" strokeWidth="1.5" strokeDasharray="2 2"/>
    <path d="M156 166h8M160 162v8" stroke="#5fbf8f" strokeWidth="1.5"/>
    <g transform={`translate(${robot[0]} ${robot[1]}) rotate(18)`}>
      <rect x="-6" y="-3" width="12" height="6" rx="1.5" fill="#e8dde2" stroke="#0c0b0c" strokeWidth="0.8"/>
      <path d="M5.5 0L2 -2V2Z" fill="#911e2b"/>
    </g>
    {chips.map(([topic, detail], i) => <g key={topic} transform={`translate(204 ${16 + i * 36})`}>
      <rect width="106" height="26" rx="4" className={i === 3 ? 'nc-chip nc-chip-on' : 'nc-chip'}/>
      <text x="8" y="11" className="nc-topic">{topic}</text><text x="8" y="21" className="nc-detail">{detail}</text>
      {i < chips.length - 1 && <path d="M53 27v8M50 32l3 3 3-3" stroke="#6b2b36" fill="none"/>}
    </g>)}
  </svg>
}
