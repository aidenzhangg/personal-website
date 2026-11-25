import { useEffect, useMemo, useState } from 'react'
import './GitHubActivity.css'

type Day = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }
type Data = { total: { lastYear: number }; contributions: Day[] }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** GitHub contribution graph for the last year, drawn from the public contributions API. */
export function GitHubActivity({ username, profileUrl }: { username: string; profileUrl: string }) {
  const [data, setData] = useState<Data | null>(null)
  const [failed, setFailed] = useState(false)

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
    let col: (Day | null)[] = Array(new Date(`${days[0].date}T00:00:00`).getDay()).fill(null)
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
    const m = new Date(`${first.date}T00:00:00`).getMonth()
    const prev = i > 0 ? weeks[i - 1].find(Boolean) : null
    return !prev || new Date(`${prev.date}T00:00:00`).getMonth() !== m ? MONTHS[m] : ''
  }), [weeks])

  if (failed) return null

  return <section className="gh-activity" aria-label="GitHub contributions in the last year">
    <div className="gh-activity-head">
      <h2>GitHub activity</h2>
      <a href={profileUrl} target="_blank" rel="noreferrer">{data ? `${data.total.lastYear.toLocaleString()} contributions in the last year` : 'Loading contributions…'}</a>
    </div>
    <div className="gh-activity-scroll">
      <div className="gh-activity-grid" style={{ gridTemplateColumns: `repeat(${weeks.length || 53}, var(--gh-cell))` }}>
        {monthLabels.map((label, i) => <span className="gh-month" key={`m${i}`} style={{ gridColumn: i + 1 }}>{label}</span>)}
        {weeks.map((week, w) => week.map((day, d) => day
          ? <span key={day.date} className={`gh-cell gh-l${day.level}`} style={{ gridColumn: w + 1, gridRow: d + 2 }} title={`${day.count} contribution${day.count === 1 ? '' : 's'} on ${new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}/>
          : <span key={`e${w}-${d}`} style={{ gridColumn: w + 1, gridRow: d + 2 }}/>))}
      </div>
    </div>
    <div className="gh-legend" aria-hidden="true"><span>Less</span>{[0, 1, 2, 3, 4].map(l => <span key={l} className={`gh-cell gh-l${l}`}/>)}<span>More</span></div>
  </section>
}
