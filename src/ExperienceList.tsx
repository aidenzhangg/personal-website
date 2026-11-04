type Entry = { title: string; date: string; bullets: string[] }
function parseEntries(value: string): Entry[] {
  return value.split(/\n\s*\n/).filter(Boolean).map(block => {
    const [title, ...lines] = block.split('\n').filter(Boolean)
    return {
      title,
      date: lines.find(line => !line.startsWith('Skills: ') && !line.startsWith('\u2022')) || '',
      bullets: lines.filter(line => line.startsWith('\u2022')).map(line => line.replace(/^\u2022\s*/, '')),
    }
  })
}

export function ExperienceList({ value, section = 'work' }: { value: string; section?: 'work' | 'teams' }) {
  const all = parseEntries(value)
  const teams = all.filter(entry => /WARG|WATonomous/.test(entry.title))
  const work = all.filter(entry => !/WARG|WATonomous/.test(entry.title))
  return <div className="compact-experience">
    {section === 'work' && <section aria-label="Work and programs"><h2 className="experience-group-title">Work &amp; Programs</h2><div className="experience-accordion">{work.map(entry => {
      const [role, ...organization] = entry.title.split(' - ')
      return <article className="experience-item" key={entry.title}><header className="experience-item-header"><div className="experience-item-heading"><h3>{role}</h3>{organization.length > 0 && <p>{organization.join(' - ')}</p>}<span className="experience-item-date">{entry.date}</span></div></header><div className="experience-item-body">{entry.bullets.length > 0 && <ul className="experience-bullets">{entry.bullets.map(line => <li key={line}>{line}</li>)}</ul>}</div></article>
    })}</div></section>}
    {section === 'teams' && teams.length > 0 && <section className="compact-design-teams"><h2 className="experience-group-title">Design Teams</h2><div className="experience-team-grid">{teams.map(entry => {
      const isWarg = entry.title.includes('WARG')
      return <article key={entry.title}><img src={isWarg ? '/icons/warg.png' : '/icons/watonomous.png'} alt="" width="44" height="32"/><div><h3>{isWarg ? 'WARG' : 'WATonomous'}</h3><p>{entry.title.split(' - ')[0]}</p><span>{entry.date}</span><div className="team-current-work"><span>Currently working on</span><a href={isWarg ? 'https://github.com/UWARG/autonomy-monorepo/issues/220' : 'https://github.com/WATonomous/wato_monorepo/issues/583'} target="_blank" rel="noreferrer">{isWarg ? 'Deconfliction & Separation Assurance #220' : 'Perception: Tracking Changes #583'}</a></div>{entry.bullets.length > 0 && <div className="experience-team-description">{entry.bullets.map(line => <p key={line}>{line}</p>)}</div>}{isWarg && <div className="team-contribution-links"><a href="https://github.com/UWARG/autonomy-monorepo/pull/218" target="_blank" rel="noreferrer">Telemetry PR #218</a><a href="https://github.com/UWARG/autonomy-monorepo/pull/180" target="_blank" rel="noreferrer">ABORT PR #180</a></div>}</div></article>
    })}</div></section>}
  </div>
}
