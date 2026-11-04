import { useEffect, useState } from 'react'
import './StatusTextDemo.css'

// Mission tree from the airside engine (manager.py + subtrees/*.py)
type Spec = [string, Spec[]?]
const TREE: Spec = ['KillSwitch', [['Mission', [
  ['ConfigureStreamRates'], ['LoadWaypointList'], ['Takeoff'],
  ['Lapping', [['SetLappingDeadline'], ['LapUntilDeadline', [['RepeatLap', [['SingleLap', [
    ['EnoughTimeForAnotherLap'], ['ResetLapWaypoints'],
    ['UntilWaypointsExhausted', [['ForEachWaypoint', [['SingleWaypoint', [
      ['LoadNextWaypoint'], ['EnoughTimeRemaining'], ['FlyToWaypoint'], ['StartLapTimer'],
    ]]]]]],
    ['RecordLapEnd'],
  ]]]]]]]],
  ['TargetReconnaissance', [['WaitForReconComplete'], ['TriggerPostProcessing']]],
  ['LandPhase', [['LoadHomeWaypoint'], ['RetryFlyToHome', [['FlyToHome']]], ['Land']]],
  ['MissionComplete'],
]]]]

type TreeNode = { id: number; name: string; depth: number; parent: TreeNode | null }

// py_trees iterates children before parents, so the snapshot (and the reporter's
// numbering) is post-order. This reproduces the IDs seen in Mission Planner.
function buildTree() {
  const preorder: TreeNode[] = []
  let next = 0
  const visit = ([name, children = []]: Spec, depth: number, parent: TreeNode | null) => {
    const node: TreeNode = { id: -1, name, depth, parent }
    preorder.push(node)
    children.forEach(child => visit(child, depth + 1, node))
    node.id = next++
  }
  visit(TREE, 0, null)
  return preorder
}
const NODES = buildTree()
const BY_NAME = new Map(NODES.map(n => [n.name, n]))
const BY_ID = new Map(NODES.map(n => [n.id, n]))

// Deepest RUNNING behaviour over the mission, in ticks of 3 simulated seconds
const SECONDS_PER_TICK = 3
const RESEND_EVERY = 30 / SECONDS_PER_TICK
const SNAPSHOTS_PER_TICK = SECONDS_PER_TICK / 0.5
const lap = (n: number) => Array.from({ length: 3 }, (_, w) => ({ name: 'FlyToWaypoint', ticks: 3, note: `Lap ${n}, waypoint ${w + 1} of 3` }))
const TIMELINE = [
  { name: 'Takeoff', ticks: 4, note: 'Climbing to mission altitude' },
  ...lap(1),
  { name: 'RepeatLap', ticks: 1, note: 'Starting the next lap' },
  ...lap(2),
  { name: 'WaitForReconComplete', ticks: 8, note: 'Pilot scanning targets, waiting for the RC switch' },
  { name: 'FlyToHome', ticks: 4, note: 'Returning to the home waypoint' },
  { name: 'Land', ticks: 4, note: 'Landing and waiting for disarm' },
  { name: 'MissionComplete', ticks: Infinity, note: 'Mission finished, tree held in RUNNING' },
]

function phaseAt(tick: number) {
  let t = tick
  for (const phase of TIMELINE) {
    if (t < phase.ticks) return phase
    t -= phase.ticks
  }
  return TIMELINE[TIMELINE.length - 1]
}

type Msg = { key: number; time: string; id: number; resend: boolean }
type State = { tick: number; lastSent: number | null; msgs: Msg[]; sent: number; key: number }
const initial: State = { tick: 0, lastSent: null, msgs: [], sent: 0, key: 0 }

const clock = (tick: number) => {
  const s = tick * SECONDS_PER_TICK
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function step(s: State): State {
  const id = BY_NAME.get(phaseAt(s.tick).name)!.id
  let { lastSent, msgs, sent, key } = s
  const send = (resend: boolean) => {
    msgs = [{ key: key++, time: clock(s.tick), id, resend }, ...msgs].slice(0, 9)
    sent++
  }
  if (id !== lastSent) { lastSent = id; send(false) }
  else if (s.tick > 0 && s.tick % RESEND_EVERY === 0) send(true)
  return { tick: s.tick + 1, lastSent, msgs, sent, key }
}

export function StatusTextDemo() {
  const [state, setState] = useState(() => step(initial))
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setState(step), 800)
    return () => window.clearInterval(timer)
  }, [playing])

  const tick = state.tick - 1
  const phase = phaseAt(tick)
  const running = BY_NAME.get(phase.name)!
  const path = new Set<number>()
  for (let n: TreeNode | null = running; n; n = n.parent) path.add(n.id)
  const snapshots = state.tick * SNAPSHOTS_PER_TICK

  return <div className="st-demo">
    <div className="st-head">
      <div><strong>STATUSTEXT reporter simulation</strong><span className="st-clock">T+{clock(tick)}</span></div>
      <div className="st-actions">
        <button className="st-play" onClick={() => setPlaying(p => !p)}>{playing ? 'Pause' : 'Play'}</button>
        <button className="st-reset" onClick={() => { setState(step(initial)); setPlaying(true) }}>Restart</button>
      </div>
    </div>

    <div className="st-pipe" aria-hidden="true">
      {['Behaviour tree snapshot', 'Deepest RUNNING node', `S,${running.id}`, 'MAVROS → MAVLink', 'Mission Planner'].map((label, i) =>
        <span key={i} className={i === 2 ? 'st-pipe-msg' : ''}>{label}</span>)}
    </div>

    <div className="st-body">
      <div className="st-tree" aria-label="Mission behaviour tree with node numbers">
        <div className="st-cap">Airside: mission tree <span>number · name</span></div>
        {NODES.map(n => {
          const active = n.id === running.id
          return <div key={n.id} className={`st-row${path.has(n.id) ? ' st-on' : ''}${active ? ' st-active' : ''}`} style={{ paddingLeft: 8 + n.depth * 14 }}>
            <span className="st-id">{n.id}</span><span className="st-mark">{path.has(n.id) ? '*' : ''}</span><span className="st-nm">{n.name}</span>
            {active && <span className="st-tag">deepest RUNNING</span>}
          </div>
        })}
      </div>

      <div className="st-side">
        <div className="st-now">
          <span className="st-cap">Currently reporting</span>
          <div className="st-big"><code key={running.id}>S,{running.id}</code><span>{running.name}</span></div>
          <small>{phase.note}</small>
        </div>

        <div className="st-mp">
          <div className="st-mp-bar">Mission Planner · Messages</div>
          <div className="st-mp-list" role="log" aria-live="polite">
            {state.msgs.map(m => <div key={m.key} className="st-mp-row">
              <span className="st-t">{m.time}</span><code>S,{m.id}</code><span className="st-dec">{BY_ID.get(m.id)!.name}</span>
              <span className={m.resend ? 'st-why st-resend' : 'st-why'}>{m.resend ? '30 s resend' : 'change'}</span>
            </div>)}
          </div>
        </div>

        <div className="st-stats">
          <div><b>{snapshots}</b><span>snapshots read<br/>(every 0.5 s)</span></div>
          <div><b>{state.sent}</b><span>STATUSTEXT<br/>messages sent</span></div>
          <div><b>{`S,${running.id}`.length} B</b><span>sent instead of<br/>{running.name.length} B name</span></div>
        </div>
      </div>
    </div>
  </div>
}
