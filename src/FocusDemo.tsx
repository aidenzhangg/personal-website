import { useEffect, useRef, useState } from 'react'
import './FocusDemo.css'

// A browser-only stand-in for Recall's camera focus check. The face is drawn, not filmed: the sliders
// play the part of MediaPipe's landmarks and blendshapes, and classify() uses the same thresholds as
// Recall's gaze.ts, so the states and timer rules match the extension.
type Gaze = 'screen' | 'away' | 'closed' | 'none'
type Pose = { turn: number; tilt: number; blink: number; present: boolean }

const BASE = { yaw: .5, pitch: .56 }
const TIMEOUT = 15, LAPSE = 2, RETURN = 2, TICK_MS = 500

function signals(pose: Pose) {
  if (!pose.present) return null
  return { yaw: .5 + pose.turn * .34, pitch: .56 + pose.tilt * .36, blink: pose.blink }
}
function classify(value: ReturnType<typeof signals>): Gaze {
  if (!value) return 'none'
  if (value.blink > .6) return 'closed'
  const pitch = value.pitch - BASE.pitch
  if (Math.abs(value.yaw - BASE.yaw) > .2 || pitch < -.24 || pitch > .24) return 'away'
  return 'screen'
}

// A short study session: steady focus, a quick glance, a long look at a phone, closed eyes, then leaving.
const SCRIPT: [number, Partial<Pose>][] = [
  [0, { turn: 0, tilt: 0, blink: 0, present: true }], [7, { turn: 0, tilt: .05 }], [8, { turn: -.8 }], [9.5, { turn: -.8 }],
  [10.5, { turn: 0 }], [15, { turn: .1, tilt: 0 }], [16, { tilt: .95 }], [33, { tilt: .95 }], [34, { tilt: 0, turn: 0 }],
  [40, { blink: 0 }], [40.6, { blink: 1 }], [45, { blink: 1 }], [45.5, { blink: 0 }], [50, { present: true }],
  [50.2, { present: false }], [56, { present: false }], [56.2, { present: true }], [62, {}],
]
function scripted(t: number): Pose {
  let pose: Pose = { turn: 0, tilt: 0, blink: 0, present: true }
  let prev: [number, Pose] = [0, pose]
  for (const [time, change] of SCRIPT) {
    const next = { ...prev[1], ...change }
    if (t < time) {
      const k = Math.min(1, Math.max(0, (t - prev[0]) / Math.max(.001, time - prev[0])))
      const ease = k * k * (3 - 2 * k)
      return { turn: prev[1].turn + (next.turn - prev[1].turn) * ease, tilt: prev[1].tilt + (next.tilt - prev[1].tilt) * ease, blink: prev[1].blink + (next.blink - prev[1].blink) * ease, present: prev[1].present }
    }
    prev = [time, next]; pose = next
  }
  return pose
}
const SCRIPT_END = SCRIPT[SCRIPT.length - 1][0]

type Session = { left: number; paused: boolean; awayRun: number; backRun: number; onScreen: number; observed: number; lapses: number; streak: number; best: number; timeline: Gaze[]; event: string }
const fresh = (): Session => ({ left: 25 * 60, paused: false, awayRun: 0, backRun: 0, onScreen: 0, observed: 0, lapses: 0, streak: 0, best: 0, timeline: [], event: 'Watching for your face' })

function step(s: Session, gaze: Gaze): Session {
  const n = { ...s, timeline: [...s.timeline, gaze].slice(-60) }
  if (s.paused) {
    n.backRun = gaze === 'screen' ? s.backRun + 1 : 0
    if (n.backRun >= RETURN) { n.paused = false; n.backRun = 0; n.awayRun = 0; n.event = 'Back on screen for 2 s, timer resumed' }
    return n
  }
  n.left = Math.max(0, s.left - 1); n.observed = s.observed + 1
  if (gaze === 'screen') {
    n.onScreen = s.onScreen + 1; n.streak = s.streak + 1; n.best = Math.max(s.best, n.streak); n.awayRun = 0
    if (s.awayRun > 0) n.event = 'Looking at the screen'
  } else {
    n.awayRun = s.awayRun + 1; n.streak = 0
    if (n.awayRun === LAPSE + 1) { n.lapses = s.lapses + 1; n.event = 'Away for over 2 s, counted as a look-away' }
    if (n.awayRun >= TIMEOUT) { n.paused = true; n.event = `Away for ${TIMEOUT} s: chime, timer paused` }
  }
  return n
}

const LABEL: Record<Gaze, string> = { screen: 'Looking at screen', away: 'Looking away', closed: 'Eyes closed', none: 'No face' }
const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

function Face({ pose, gaze }: { pose: Pose; gaze: Gaze }) {
  if (!pose.present) return <g className="fd-empty"><text x="160" y="124">No face in view</text></g>
  const cx = 160, cy = 118, rx = 56 * (1 - Math.abs(pose.turn) * .12), ry = 72
  const fx = cx + pose.turn * 30, fy = cy + pose.tilt * 40
  const oval = Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as const })
  const eyeOpen = 1 - pose.blink
  const eye = (side: number) => {
    const ex = fx + side * 21 * (1 - Math.abs(pose.turn) * .25) + pose.turn * 4, ey = fy - 12
    return <g key={side}><ellipse className="fd-eye" cx={ex} cy={ey} rx="11" ry={Math.max(.6, 6 * eyeOpen)}/>{eyeOpen > .25 && <circle className="fd-pupil" cx={ex + pose.turn * 3} cy={ey + pose.tilt * 2} r={2.6 * Math.min(1, eyeOpen * 1.4)}/>}{[-11, -5.5, 0, 5.5, 11].map(dx => <circle key={dx} className="fd-dot" cx={ex + dx} cy={ey - 6 * eyeOpen * Math.cos(dx / 11 * 1.2)} r="1.1"/>)}</g>
  }
  return <g className={`fd-face fd-${gaze}`}>
    <ellipse className="fd-skin" cx={cx} cy={cy} rx={rx} ry={ry}/>
    <path className="fd-hair" d={`M${cx - rx + 2} ${cy - 26} Q${cx - rx} ${cy - ry - 10} ${cx} ${cy - ry - 6} Q${cx + rx} ${cy - ry - 10} ${cx + rx - 2} ${cy - 26} Q${cx + rx - 14} ${fy - ry + 22} ${cx + pose.turn * 20} ${fy - ry + 26} Q${cx - rx + 14} ${fy - ry + 22} ${cx - rx + 2} ${cy - 26}Z`}/>
    {oval.map(([x, y], i) => <circle key={i} className="fd-dot" cx={x} cy={y} r="1.4"/>)}
    <polyline className="fd-outline" points={[...oval, oval[0]].map(p => p.join(',')).join(' ')}/>
    {eye(-1)}{eye(1)}
    <path className="fd-brow" d={`M${fx - 34} ${fy - 30} q12 -6 24 -1 M${fx + 10} ${fy - 31} q12 -5 24 1`}/>
    <path className="fd-nose" d={`M${fx} ${fy - 4} l${-5 + pose.turn * 6} 18 h10`}/>
    <circle className="fd-key" cx={fx + pose.turn * 6} cy={fy + 13} r="2.6"/>
    <path className="fd-mouth" d={`M${fx - 15} ${fy + 34} q15 7 30 0`}/>
  </g>
}

export function FocusDemo() {
  const [pose, setPose] = useState<Pose>({ turn: 0, tilt: 0, blink: 0, present: true })
  const [playing, setPlaying] = useState(true)
  const [session, setSession] = useState<Session>(fresh)
  const clock = useRef(0)
  const poseRef = useRef(pose)
  useEffect(() => { poseRef.current = pose }, [pose])
  const gaze = classify(signals(pose))

  useEffect(() => {
    if (!playing) return
    const started = performance.now() - clock.current * 1000
    let frame = 0
    const loop = (now: number) => {
      const t = (now - started) / 1000 * 2 // demo runs at double speed
      if (t >= SCRIPT_END) { clock.current = 0; setPlaying(false); return }
      clock.current = t / 2
      setPose(scripted(t))
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  useEffect(() => {
    const id = setInterval(() => setSession(s => step(s, classify(signals(poseRef.current)))), TICK_MS)
    return () => clearInterval(id)
  }, [])

  const manual = (change: Partial<Pose>) => { setPlaying(false); clock.current = 0; setPose(p => ({ ...p, ...change })) }
  const replay = () => { clock.current = 0; setSession(fresh()); setPlaying(true) }
  const score = session.observed ? Math.round(session.onScreen / session.observed * 100) : 100
  const countdown = !session.paused && gaze !== 'screen' && session.awayRun > LAPSE ? TIMEOUT - session.awayRun : null

  return <div className="focus-demo">
    <div className="fd-stage">
      <svg viewBox="0 0 320 240" role="img" aria-label={`Illustrated face, classified as ${LABEL[gaze]}`}>
        <rect width="320" height="240" className="fd-bg"/>
        <g className="fd-grid">{[40, 80, 120, 160, 200, 240, 280].map(x => <path key={x} d={`M${x} 0V240`}/>)}{[40, 80, 120, 160, 200].map(y => <path key={y} d={`M0 ${y}H320`}/>)}</g>
        <Face pose={pose} gaze={gaze}/>
        <g className="fd-readout"><text x="12" y="20">yaw {signals(pose)?.yaw.toFixed(2) ?? '--'}</text><text x="12" y="34">pitch {signals(pose)?.pitch.toFixed(2) ?? '--'}</text><text x="12" y="48">blink {pose.present ? pose.blink.toFixed(2) : '--'}</text></g>
      </svg>
      <span className={`fd-chip fd-chip-${gaze}`}>{LABEL[gaze]}</span>
    </div>
    <div className="fd-panel">
      <div className="fd-timer"><strong>{fmt(session.left)}</strong><span>{session.paused ? 'Paused: look back to resume' : countdown !== null ? `Pausing in ${countdown} s` : 'Focusing'}</span></div>
      <dl className="fd-stats"><div><dt>Screen attention</dt><dd>{score}%</dd></div><div><dt>Look-aways</dt><dd>{session.lapses}</dd></div><div><dt>Best streak</dt><dd>{fmt(session.best)}</dd></div></dl>
      <div className="fd-strip" aria-label="Last 60 seconds">{Array.from({ length: 60 }, (_, i) => session.timeline[i - (60 - session.timeline.length)]).map((g, i) => <i key={i} className={g ? `fd-s-${g}` : ''}/>)}</div>
      <p className="fd-event" aria-live="polite">{session.event}</p>
      <div className="fd-controls">
        <label>Head turn<input type="range" min="-1" max="1" step=".01" value={pose.turn} onChange={e => manual({ turn: +e.target.value })}/></label>
        <label>Head tilt<input type="range" min="-1" max="1" step=".01" value={pose.tilt} onChange={e => manual({ tilt: +e.target.value })}/></label>
        <label>Eyes closed<input type="range" min="0" max="1" step=".01" value={pose.blink} onChange={e => manual({ blink: +e.target.value })}/></label>
        <div className="fd-buttons"><button type="button" onClick={() => manual({ present: !pose.present })}>{pose.present ? 'Step away' : 'Come back'}</button><button type="button" onClick={() => manual({ turn: 0, tilt: 0, blink: 0, present: true })}>Face the screen</button><button type="button" className="fd-primary" onClick={replay}>{playing ? 'Restart' : 'Play scenario'}</button></div>
      </div>
    </div>
  </div>
}
