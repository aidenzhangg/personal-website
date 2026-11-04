type Entry = { title: string; date: string; skills: string[]; bullets: string[] }
function parseEntries(value: string): Entry[] {
  return value.split(/\n\s*\n/).filter(Boolean).map(block => {
    const [title, ...lines] = block.split('\n').filter(Boolean)
    return {
      title,
      date: lines.find(line => !line.startsWith('Skills: ') && !line.startsWith('\u2022')) || '',
      skills: (lines.find(line => line.startsWith('Skills: '))?.slice(8) || '').split(',').map(skill => skill.trim()).filter(Boolean),
      bullets: lines.filter(line => line.startsWith('\u2022')).map(line => line.replace(/^\u2022\s*/, '')),
    }
  })
}

export function ExperienceList({ value }: { value: string }) {
  const all = parseEntries(value)
  const teams = all.filter(entry => /WARG|WATonomous/.test(entry.title))
  const work = all.filter(entry => !/WARG|WATonomous/.test(entry.title))
  return <div className="compact-experience">
    <section aria-label="Work and programs"><h2 className="experience-group-title">Work &amp; Programs</h2><div className="experience-accordion">{work.map(entry => {
      const [role, ...organization] = entry.title.split(' - ')
      return <details className="experience-item" name="experience-roles" key={entry.title}><summary><div className="experience-item-heading"><h3>{role}</h3>{organization.length > 0 && <p>{organization.join(' - ')}</p>}<span className="experience-item-date">{entry.date}</span></div><span className="experience-toggle"><span className="experience-show">Details</span><span className="experience-hide">Close</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></span></summary><div className="experience-item-body">{entry.bullets.length > 0 && <ul className="experience-bullets">{entry.bullets.map(line => <li key={line}>{line}</li>)}</ul>}{entry.skills.length > 0 && <div className="entry-strengths" aria-label="Skills"><ul>{entry.skills.map(skill => <li className="activity-skill-token" key={skill}><span>{skill.toUpperCase()}</span></li>)}</ul></div>}</div></details>
    })}</div></section>
    {teams.length > 0 && <section className="compact-design-teams"><h2 className="experience-group-title">Design Teams</h2><div className="experience-team-grid">{teams.map(entry => {
      const isWarg = entry.title.includes('WARG')
      return <article key={entry.title}><img src={isWarg ? '/icons/warg.png' : '/icons/watonomous.png'} alt="" width="44" height="32"/><div><h3>{isWarg ? 'WARG' : 'WATonomous'}</h3><p>{entry.title.split(' - ')[0]}</p><span>{entry.date}</span></div></article>
    })}</div></section>}
  </div>
}
