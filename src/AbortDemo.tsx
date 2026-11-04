import { useEffect, useState } from 'react'
import './AbortDemo.css'

type Status = 'idle' | 'running' | 'success' | 'failure' | 'halted'
type LogKind = 'info' | 'error' | 'ground' | 'tree'
type Log = { id: number; kind: LogKind; text: string }

const MISSION = [
  { name: 'ConfigureStreamRates', ticks: 1 },
  { name: 'LoadWaypointList', ticks: 1 },
  { name: 'Takeoff', ticks: 5 },
  { name: 'Lapping', ticks: 8 },
  { name: 'TargetReconnaissance', ticks: 6 },
  { name: 'LandPhase', ticks: 5 },
  { name: 'MissionComplete', ticks: Infinity },
]
const CRUISE_ALT = 30
const TICK_MS = 900

type State = {
  tick: number
  step: number
  stepTicks: number
  abortSent: boolean
  aborted: boolean
  land: 0 | 1 | 2 | 3
  alt: number
  checks: boolean[]
  logs: Log[]
  nextId: number
}

const initial: State = {
  tick: 0, step: 0, stepTicks: 0, abortSent: false, aborted: false, land: 0, alt: 0, checks: [],
  logs: [{ id: 0, kind: 'tree', text: 'SafetySupervisor: ticking tree' }], nextId: 1,
}

function advance(s: State): State {
  const logs = [...s.logs]
  let id = s.nextId
  const log = (kind: LogKind, text: string) => { logs.push({ id: id++, kind, text }) }
  let { step, stepTicks, aborted, land, alt } = s

  if (s.abortSent && !aborted) {
    aborted = true
    land = 1
    log('error', 'CheckAbort: ABORT received')
    log('ground', 'ENG: ABORT received')
    log('tree', `Selector halts Mission at ${MISSION[step].name}`)
    log('info', 'AbortLand: commanding land')
    log('ground', 'ENG: landing')
  } else if (aborted) {
    if (land === 1) land = 2
    else if (land === 2) {
      alt = Math.max(0, alt - 6)
      if (alt === 0) {
        land = 3
        log('info', 'AbortLand: landed and disarmed')
        log('ground', 'ENG: landed and disarmed')
        log('tree', 'Aborted holds the tree in RUNNING')
      } else log('info', 'AbortLand: descending')
    }
  } else {
    const current = MISSION[step]
    stepTicks++
    if (current.name === 'Takeoff') alt = Math.min(CRUISE_ALT, alt + CRUISE_ALT / current.ticks)
    if (current.name === 'LandPhase') alt = Math.max(0, alt - CRUISE_ALT / current.ticks)
    if (stepTicks >= current.ticks) {
      log('tree', `${current.name} → SUCCESS`)
      step++
      stepTicks = 0
    }
  }

  return {
    ...s, tick: s.tick + 1, step, stepTicks, aborted, land, alt,
    checks: [...s.checks, s.abortSent].slice(-24), logs: logs.slice(-8), nextId: id,
  }
}

function Node({ name, kind, status }: { name: string; kind?: string; status: Status }) {
  return <div className={`ad-node ad-${status}`}>
    <span className="ad-dot" aria-hidden="true"/>
    <span className="ad-name">{name}</span>
    {kind && <span className="ad-kind">{kind}</span>}
    {status === 'halted' && <span className="ad-badge">halted</span>}
  </div>
}

function Drone() {
  return <svg width="46" height="24" viewBox="0 0 46 24" aria-hidden="true">
    <rect x="16" y="9" width="14" height="7" rx="2" fill="#e8dde2"/>
    <path d="M7 6 L16 11 M39 6 L30 11 M7 19 L16 14 M39 19 L30 14" stroke="#a89aa1" strokeWidth="2"/>
    <ellipse cx="7" cy="5" rx="7" ry="1.6" fill="#d14b5d"/><ellipse cx="39" cy="5" rx="7" ry="1.6" fill="#d14b5d"/>
    <circle cx="7" cy="19" r="2.2" fill="#a89aa1"/><circle cx="39" cy="19" r="2.2" fill="#a89aa1"/>
  </svg>
}

export function AbortDemo() {
  const [state, setState] = useState(initial)

  useEffect(() => {
    const timer = window.setInterval(() => setState(advance), TICK_MS)
    return () => window.clearInterval(timer)
  }, [])

  const { step, aborted, land, alt, checks, logs, tick } = state
  const mission = (i: number): Status => i < step ? 'success' : i === step ? (aborted ? 'halted' : 'running') : 'idle'
  const landStatus: Status = aborted ? (land === 3 ? 'success' : 'running') : 'idle'
  const flight = land === 3 ? 'Landed and disarmed' : aborted ? 'ABORT: landing' : `Mission: ${MISSION[step].name}`

  return <div className="ad-demo">
    <div className="ad-head">
      <div><strong>Behaviour tree simulation</strong><span className="ad-tick">tick {tick}</span></div>
      <div className="ad-actions">
        <button className="ad-abort" disabled={state.abortSent} onClick={() => setState(s => ({ ...s, abortSent: true }))}>{state.abortSent ? 'ABORT sent' : 'Send ABORT'}</button>
        <button className="ad-reset" onClick={() => setState(initial)}>Restart</button>
      </div>
    </div>

    <div className="ad-body">
      <div className="ad-tree">
        <Node name="SafetySupervisor" kind="Selector" status="running"/>
        <ul>
          <li><Node name="Abort" kind="Sequence" status={aborted ? 'running' : 'failure'}/>
            <ul>
              <li key={aborted ? 'done' : tick}><Node name="CheckAbort" kind="Condition" status={aborted ? 'success' : 'failure'}/></li>
              <li><Node name="RetryLand" kind="Retry ∞" status={landStatus}/>
                <ul><li><Node name="AbortLand" kind="mavros/cmd/land" status={landStatus}/></li></ul>
              </li>
              <li><Node name="Aborted" kind="Running" status={land === 3 ? 'running' : 'idle'}/></li>
            </ul>
          </li>
          <li><Node name="KillSwitch" kind="Decorator" status={aborted ? 'halted' : 'running'}/>
            <ul><li><Node name="Mission" kind="Sequence" status={aborted ? 'halted' : 'running'}/>
              <ul>{MISSION.map((m, i) => <li key={m.name}><Node name={m.name} status={mission(i)}/></li>)}</ul>
            </li></ul>
          </li>
        </ul>
      </div>

      <div className="ad-side">
        <div className="ad-gauge" aria-label={`Altitude ${alt.toFixed(1)} metres`}>
          <span className="ad-mark" style={{ bottom: '84%' }}>30 m</span>
          <span className="ad-mark" style={{ bottom: '44%' }}>15 m</span>
          <div className={`ad-drone${aborted && land < 3 ? ' ad-landing' : ''}`} style={{ bottom: `${4 + (alt / CRUISE_ALT) * 80}%` }}><Drone/></div>
          <div className="ad-ground"/>
        </div>
        <div className="ad-readout"><span>{alt.toFixed(1)} m</span><span className={aborted ? 'ad-red' : ''}>{flight}</span></div>

        <div className="ad-checks">
          <span>CheckAbort result each tick</span>
          <div>{Array.from({ length: 24 }, (_, i) => {
            const v = checks[checks.length - 24 + i]
            return <i key={i} className={v === undefined ? '' : v ? 'ad-pass' : 'ad-fail'}/>
          })}</div>
          <small><i className="ad-fail"/> FAILURE: mission keeps running <i className="ad-pass"/> SUCCESS: abort takes over</small>
        </div>
      </div>
    </div>

    <div className="ad-console" role="log" aria-live="polite">
      {logs.map(l => <div key={l.id} className={`ad-log ad-log-${l.kind}`}><span>{l.kind === 'error' ? '[ERROR]' : l.kind === 'ground' ? '[GROUND]' : l.kind === 'tree' ? '[TREE]' : '[INFO]'}</span>{l.text}</div>)}
    </div>
  </div>
}
