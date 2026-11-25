import { useEffect, useMemo, useRef, useState } from 'react'
import './GitHubActivity.css'

type Day = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }
type Data = { total: { lastYear: number }; contributions: Day[] }
type Tip = { text: string; x: number; y: number }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const parse = (date: string) => new Date(`${date}T00:00:00`)
const label = (day: Day) => `${day.count === 0 ? 'No' : day.count} contribution${day.count === 1 ? '' : 's'} on ${parse(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`

/** GitHub contribution graph for the last year, drawn from the public contributions API. */
export function GitHubActivity({ username, profileUrl }: { username: string; profileUrl: string }) {
  const [data, setData] = useState<Data | null>(null)
  const [failed, setFailed] = useState(false)
  const [tip, setTip] = useState<Tip | null>(null)
  const boxRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctl = new AbortController()
    fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`, { signal: ctl.signal })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: Data) => setData(d))
      .catch(err => { if ((err as Error).name !== 'AbortError') setFailed(true) })
    return () => ctl.abort()
  }, [username])

  // Group days into week columns starting on Sunday, padding the first week.
  const weeks = useMemo(() => {
    if (!data) return []
    const days = data.contributions
    const cols: (Day | null)[][] = []
    let col: (Day | null)[] = Array(parse(days[0].date).getDay()).fill(null)
    for (const day of days) {
      col.push(day)
      if (col.length === 7) { cols.push(col); col = [] }
    }
    if (col.length) cols.push(col)
    return cols
  }, [data])

  const monthLabels = useMemo(() => weeks.map((week, i) => {
    const first = week.find(Boolean)
    if (!first) return ''
    const m = parse(first.date).getMonth()
    const prev = i > 0 ? weeks[i - 1].find(Boolean) : null
    return !prev || parse(prev.date).getMonth() !== m ? MONTHS[m] : ''
  }), [weeks])

  function show(day: Day, cell: HTMLElement) {
    const box = boxRef.current
    if (!box) return
    const b = box.getBoundingClientRect(), c = cell.getBoundingClientRect()
    setTip({ text: label(day), x: c.left - b.left + c.width / 2, y: c.top - b.top })
  }

  if (failed) return null

  return <section className="gh-activity" ref={boxRef} aria-label="GitHub contributions in the last year" onMouseLeave={() => setTip(null)}>
    <div className="gh-activity-head">
      <h2>GitHub activity</h2>
      <a href={profileUrl} target="_blank" rel="noreferrer">{data ? `${data.total.lastYear.toLocaleString()} contributions in the last year` : 'Loading contributions…'}</a>
    </div>
    <div className="gh-activity-scroll" onScroll={() => setTip(null)}>
      <div className="gh-activity-grid" style={{ gridTemplateColumns: `repeat(${weeks.length || 53}, var(--gh-cell))` }}>
        {monthLabels.map((m, i) => <span className="gh-month" key={`m${i}`} style={{ gridColumn: i + 1 }}>{m}</span>)}
        {weeks.map((week, w) => week.map((day, d) => day
          ? <span key={day.date} className={`gh-cell gh-l${day.level}`} style={{ gridColumn: w + 1, gridRow: d + 2 }} tabIndex={0} aria-label={label(day)}
              onMouseEnter={e => show(day, e.currentTarget)} onFocus={e => show(day, e.currentTarget)} onBlur={() => setTip(null)}/>
          : <span key={`e${w}-${d}`} style={{ gridColumn: w + 1, gridRow: d + 2 }}/>))}
      </div>
    </div>
    <div className="gh-legend" aria-hidden="true"><span>Less</span>{[0, 1, 2, 3, 4].map(l => <span key={l} className={`gh-cell gh-l${l}`}/>)}<span>More</span></div>
    {tip && <div className="gh-tip" role="tooltip" style={{ left: tip.x, top: tip.y }}>{tip.text}</div>}
  </section>
}
