import { useEffect, useRef, useState, type FormEvent } from 'react'
import './App.css'
import resumeProfile from './profile.json'
import { ProjectPhotos } from './ProjectPhotos'
import { useWindowControls } from './useWindowControls'
import { ContactForm } from './ContactForm'
import { QuickSettings } from './QuickSettings'

const tabs = ['About', 'Projects', 'Technical Skills', 'Experience', 'Extracurriculars', 'Certifications', 'Resume', 'Portfolio', 'Education', 'Contact'] as const
type Tab = typeof tabs[number]
type PortfolioItem = { id: string; title: string; description: string; url: string; image: string }
type Certification = { title: string; issuer: string; date: string; description: string; url: string }
type Profile = { name: string; email: string; location: string; intro: string; about: string; skills: string; projects: string; experience: string; extracurriculars: string; github: string; linkedin: string; photo: string; gallery: string[]; resume: string; portfolioPdf?: string; portfolio: PortfolioItem[]; contentVersion: number; certifications: Certification[] }
const initial: Profile = resumeProfile
const projects = initial.projects.split(/\n\s*\n/).filter(Boolean).map((block, index) => {
 const [title, date, tech, ...description] = block.split('\n')
 return { title, date, tech, description, index, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
})
function readRoute() {
 const [section, slug] = window.location.hash.slice(1).split('/')
 const tab = tabs.find(item => item.toLowerCase().replaceAll(' ', '-') === section) || 'About'
 return { tab, slug: tab === 'Projects' && projects.some(project => project.slug === slug) ? slug : null }
}
const skillIcons: Record<string, string> = {
 Java: 'java', Python: 'python', 'C++': 'cplusplus', SQL: 'postgresql', HTML: 'html5', CSS: 'css3', TypeScript: 'typescript', JavaScript: 'javascript',
 React: 'react', 'Spring Boot': 'spring', PyTorch: 'pytorch', TensorFlow: 'tensorflow', 'scikit-learn': 'scikitlearn', OpenCV: 'opencv', 'ROS 2': 'ros', pandas: 'pandas', NumPy: 'numpy',
 Git: 'git', GitHub: 'github', Docker: 'docker', PyCharm: 'pycharm', Eclipse: 'eclipse', Vite: 'vitejs', 'Chrome DevTools': 'chrome', 'VS Code': 'vscode', PostgreSQL: 'postgresql', PyTest: 'pytest', YAML: 'yaml',
}
function SkillIcon({ name }: { name: string }) {
  const [failed, setFailed] = useState(false)
  return skillIcons[name] && !failed ? <img src={`/icons/tech/${skillIcons[name]}.svg`} alt="" width="28" height="28" onError={() => setFailed(true)}/> : <span className="skill-initial" aria-hidden="true">{name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2)}</span>
}
function ProjectPreview() {
 return <div className="project-image-space" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/></svg><span>Project photo</span></div>
}
function readSavedMedia(): Pick<Profile, 'photo' | 'gallery'> {
  try {
    const saved = JSON.parse(localStorage.getItem('aiden-portfolio') || '{}')
    return { photo: typeof saved?.photo === 'string' ? saved.photo : '', gallery: Array.isArray(saved?.gallery) ? saved.gallery.filter((image: unknown) => typeof image === 'string') : [] }
  } catch { return { photo: '', gallery: [] } }
}
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const appIcons: Record<string, string> = {
    Sound: '/icons/sound.svg',
    Battery: '/icons/battery.svg',
    About: '/icons/explorer.png',
    Portfolio: '/icons/documents.png',
    Projects: '/icons/explorer.png',
    Resume: '/icons/word.png',
    Certifications: '/icons/documents.png',
    Education: '/icons/waterloo.png',
    Experience: '/icons/documents.png',
    'Technical Skills': '/icons/documents.png',
    Extracurriculars: '/icons/explorer.png',
    Contact: '/icons/gmail.png',
    GitHub: '/icons/github.svg',
    LinkedIn: '/icons/linkedin.png',
  }
  if (appIcons[name]) return <img className={`app-icon app-icon-${name.toLowerCase()}`} src={appIcons[name]} width={size} height={size} alt="" aria-hidden="true"/>
  const paths: Record<string, string> = {
    Settings: 'm15 4 5 5M4 20l5-1L21 7l-5-5L4 14v6Z',
    Wifi: 'M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0m-4 4h.01',
    Sound: 'M3 9h4l5-5v16l-5-5H3V9Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16',
    Battery: 'M2 7h18v10H2V7Zm20 3v4M5 10h10v4H5v-4Z',
    Search: 'M16 16l5 5M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14',
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.Search}/></svg>
}
function App() {
  const [media] = useState(readSavedMedia)
  const profile: Profile = { ...initial, ...media }
  const [tab, setTab] = useState<Tab>(() => readRoute().tab)
  const [projectSlug, setProjectSlug] = useState<string | null>(() => readRoute().slug)
  const activeProject = projects.find(project => project.slug === projectSlug)
  useEffect(() => { const syncRoute = () => { const route = readRoute(); setTab(route.tab); setProjectSlug(route.slug) }; window.addEventListener('hashchange', syncRoute); window.addEventListener('popstate', syncRoute); return () => { window.removeEventListener('hashchange', syncRoute); window.removeEventListener('popstate', syncRoute) } }, [])
  const [navOpen, setNavOpen] = useState(false)
  const [navSearch, setNavSearch] = useState('')
  const [search, setSearch] = useState('')
  const [searchMessage, setSearchMessage] = useState('')
  function findSection(e: FormEvent) { e.preventDefault(); const found = tabs.find(item => (item === 'About' ? 'about' : item.toLowerCase()).includes(search.trim().toLowerCase())); if (found && search.trim()) { navigate(found); setSearchMessage('') } else { setSearchMessage('Choose About, Projects, Technical Skills, Experience, Extracurriculars, Certifications, Resume, Portfolio, Education, or Contact.'); } }
  const [locked, setLocked] = useState(true)
  const [unlocking, setUnlocking] = useState(false)
  const unlockTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(unlockTimer.current), [])
  function unlock() { if (unlocking) return; setUnlocking(true); const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; unlockTimer.current = window.setTimeout(() => { setLocked(false); setUnlocking(false); windowControls.restore() }, reducedMotion ? 0 : 520) }
  const [startOpen, setStartOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [brightness, setBrightness] = useState(100)
  const [night, setNight] = useState(false)
  const [energy, setEnergy] = useState(false)
  const [accessible, setAccessible] = useState(false)
  const windowControls = useWindowControls()
  const windowOpen = windowControls.visible
  const maximized = windowControls.maximized
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setSettingsOpen(false); setStartOpen(false); setNavOpen(false) } }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close) }, [])
  const [now, setNow] = useState(new Date())
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 30000); return () => window.clearInterval(timer) }, [])
  function navigate(next: Tab) { setTab(next); setProjectSlug(null); setNavOpen(false); windowControls.restore(); setStartOpen(false); window.history.pushState(null, '', `#${next.toLowerCase().replaceAll(' ', '-')}`); window.scrollTo({ top: 0 }) }
  function openProject(slug: string) { setTab('Projects'); setProjectSlug(slug); windowControls.restore(); window.history.pushState(null, '', `#projects/${slug}`); window.scrollTo({ top: 0 }) }
  const social = (label: string, url: string) => url ? <a className="social-link" href={url} target="_blank" rel="noreferrer">{label}</a> : <span className="social-link unavailable">{label}<small>Not added yet</small></span>
  const entries = (value: string, label: string) => value.trim() ? <div className="resume-entries">{value.trim().split(/\n\s*\n/).map((block, index) => {
    const [title, ...body] = block.split('\n').filter(Boolean)
    const bullets = body.filter(line => line.startsWith('•'))
    const softSkills = body.find(line => line.startsWith('Skills: '))?.slice(8)
    return <article key={index}><div className="entry-title-row"><h2>{title}</h2></div>{body.filter(line => !line.startsWith('•') && !line.startsWith('Skills: ')).map((line, i) => <p key={i}>{line}</p>)}{softSkills && <div className="entry-strengths" aria-label="Soft skills"><span>Strengths</span><ul>{softSkills.split(',').map(skill => <li key={skill.trim()}>{skill.trim()}</li>)}</ul></div>}{bullets.length > 0 && <ul>{bullets.map((line, i) => <li key={i}>{line.replace(/^•\s*/, '')}</li>)}</ul>}{label === 'Activities' && title.includes('DECA') && <div className="activity-pdf"><div className="activity-pdf-title"><Icon name="Resume" size={32}/><div><h3>Bayview DECA Business Report</h3><span>PDF document</span></div></div><div className="activity-pdf-actions"><a className="primary" href="/Bayview-DECA-Business-Report.pdf" target="_blank" rel="noreferrer">View Report (PDF)</a><a className="secondary" href="/Bayview-DECA-Business-Report.pdf" download>Download PDF</a></div></div>}</article>
  })}</div> : <div className="empty-state"><h2>No {label.toLowerCase()} added yet</h2></div>
  const dateParts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Toronto' }).formatToParts(now)
  const dateValue = (part: string) => dateParts.find(p => p.type === part)?.value || ''
  const dateLabel = `${dateValue('year')}-${dateValue('month')}-${dateValue('day')}`
  const timeLabel = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Toronto' })
  if (locked) return <main className={`lock-screen ${unlocking ? "lock-exiting" : ""}`}><div className="lock-clock"><time>{timeLabel}</time><p>{dateLabel}</p></div><section className="lock-account">{profile.photo && <div className="lock-avatar"><img src={profile.photo} alt={profile.name}/></div>}<h1>Aiden’s <span>Portfolio</span></h1><button className="primary" onClick={unlock} disabled={unlocking}>Enter <span aria-hidden="true">→</span></button></section><div className="lock-tray"><Icon name="Wifi" size={20}/><Icon name="Sound" size={20}/><Icon name="Battery" size={23}/></div></main>
  return <>
    <a href="#main" className="skip">Skip to content</a>
    <div className={`win-desktop ${night ? "night-light" : ""} ${energy ? "energy-saver" : ""} ${accessible ? "large-text" : ""}`}>
      <div className="desktop-apps" aria-label="Desktop shortcuts">{(['About','Projects','Technical Skills','Resume','Portfolio'] as const).map(item => <button key={item} onClick={() => navigate(item)}><span className="desktop-app-icon"><Icon name={item} size={29}/></span><span>{item === 'About' ? 'About' : item}</span></button>)}</div>
      {windowOpen ? <section ref={windowControls.frame} style={{ ...windowControls.style, filter: `brightness(${brightness / 100})` }} className={`win-window ${maximized ? 'win-maximized' : ''} ${windowControls.floating ? 'win-floating' : ''} ${windowControls.minimizing ? 'win-minimizing' : ''} ${windowControls.dragging ? 'win-dragging' : ''}`} aria-label="Portfolio window"><header className="win-titlebar" tabIndex={0} aria-label="Window title bar. Drag to move, or use Alt and arrow keys." onPointerDown={windowControls.pointerDown} onPointerMove={windowControls.pointerMove} onPointerUp={windowControls.pointerUp} onPointerCancel={windowControls.pointerUp} onKeyDown={windowControls.keyDown} onDoubleClick={event => { if (!(event.target as HTMLElement).closest('button')) windowControls.toggleMaximized() }}><span><Icon name={tab} size={16}/>{tab === 'About' ? 'About' : tab}</span><div className="win-controls"><button aria-label="Minimize window" onClick={windowControls.minimize}><span className="minimize-glyph" aria-hidden="true"/></button><button aria-label={maximized ? 'Restore window' : 'Maximize window'} onClick={windowControls.toggleMaximized}>□</button><button className="win-close" aria-label="Close window" onClick={windowControls.close}>×</button></div></header>
      <div className="win-toolbar"><button className="mobile-menu-toggle" aria-label="Toggle navigation" aria-expanded={navOpen} aria-controls="portfolio-sidebar" onClick={() => setNavOpen(!navOpen)}><span/><span/><span/></button><button className="win-back" aria-label={activeProject ? "Back to projects" : "Open About"} onClick={() => navigate(activeProject ? 'Projects' : 'About')}>←</button><div className="win-breadcrumb"><Icon name="Portfolio" size={16}/><span>Portfolio</span><span>›</span><span>{tab}</span>{activeProject && <><span>&rsaquo;</span><span className="breadcrumb-project">{activeProject.title}</span></>}</div></div>
      <div className="win-body"><aside id="portfolio-sidebar" className={`win-sidebar ${navOpen ? "navigation-open" : ""}`}><span className="nav-heading">PORTFOLIO</span><label className="sidebar-search"><Icon name="Search" size={15}/><input aria-label="Filter navigation" placeholder="Find a section" value={navSearch} onChange={e => setNavSearch(e.target.value)}/></label><nav aria-label="Portfolio sections">{tabs.filter(item => item.toLowerCase().includes(navSearch.toLowerCase())).map(item => <button key={item} onClick={() => navigate(item)} aria-current={item === tab ? 'page' : undefined}><Icon name={item} size={18}/><span>{item}</span>{item === "Projects" && <small className="nav-count">{profile.projects.split(/\n\s*\n/).filter(Boolean).length}</small>}{item === "Certifications" && <small className="nav-count">{profile.certifications.length}</small>}</button>)}</nav>{!tabs.some(item => item.toLowerCase().includes(navSearch.toLowerCase())) && <p className="nav-no-results">No matching sections.</p>}<a className="sidebar-email" href={`mailto:${profile.email}`}><Icon name="Contact" size={15}/><span>Email</span></a></aside>
      <main id="main" className="win-content" key={`${tab}:${projectSlug || "index"}`}>
          {tab === 'About' ? <><section className="plain-about"><div className="identity-kicker"><span/>PERSONAL PORTFOLIO</div>{profile.photo && <img className="plain-portrait" src={profile.photo} alt={profile.name}/>}<h1 className="pixel-name" aria-label={profile.name}>{Array.from(profile.name).map((letter, index) => <span key={index} aria-hidden="true" style={{ animationDelay: `${index * 45}ms` }}>{letter === " " ? "\u00a0" : letter}</span>)}</h1><p className="internship-line"><span/>Seeking Summer 2027 Co-op</p><div className="identity-meta"><span>{profile.location}</span><a href={`mailto:${profile.email}`}>{profile.email}</a></div>{profile.intro && <p>{profile.intro}</p>}{profile.about && <p>{profile.about}</p>}<div className="identity-links"><button onClick={() => navigate('Projects')}>View Projects</button><button onClick={() => navigate('Resume')}>View Resume (PDF)</button><button onClick={() => navigate('Portfolio')}>View Portfolio (PDF)</button></div><div className="identity-bottom"><div className="identity-socials"><a href={profile.github} target="_blank" rel="noreferrer"><Icon name="GitHub" size={18}/>GitHub</a><a href={profile.linkedin} target="_blank" rel="noreferrer"><Icon name="LinkedIn" size={18}/>LinkedIn</a></div><span className="identity-small">Aiden Zhang / Portfolio</span></div></section>
          </> : <><div className="page-eyebrow">PORTFOLIO / {tab.toUpperCase()}</div><div className="page-heading"><span className="page-icon"><Icon name={tab} size={30}/></span><div><h1>{activeProject ? activeProject.title : tab}</h1></div>{tab === "Projects" && !activeProject && <span className="page-total">{profile.projects.split(/\n\s*\n/).filter(Boolean).length} projects</span>}</div>
            {tab === 'Education' && <div className="education-list"><article className="education-card"><a className="waterloo-logo-link" href="https://uwaterloo.ca/engineering/" target="_blank" rel="noreferrer" aria-label="University of Waterloo Engineering"><img className="waterloo-logo" src="/icons/waterloo.png" alt="University of Waterloo"/></a><div className="education-copy"><h2>University of Waterloo</h2><p className="education-degree">BASc, Honours Computer Engineering</p><p className="education-dates">September 2026 - May 2031</p></div></article><article className="school-card"><span className="school-period">2022 - 2026</span><h2>Bayview Secondary School</h2><p>International Baccalaureate (IB) Program</p><p className="school-honour">Honour Roll Student</p></article></div>}
            {tab === 'Portfolio' && <section className="portfolio-pdf-empty"><Icon name="Portfolio" size={38}/><h2>Portfolio PDF</h2><p>Not added yet.</p></section>}
            {tab === 'Projects' && (activeProject ? <article className="project-screen"><button className="project-back-link" onClick={() => navigate('Projects')}>Back to projects</button>{activeProject.date !== 'Date not listed' && <p className="project-screen-date">{activeProject.date}</p>}<p className="project-screen-tech">{activeProject.tech}</p><ProjectPhotos title={activeProject.title}/>{activeProject.description.length > 0 && <section className="project-overview"><h2>Project details</h2><ul>{activeProject.description.map((line, index) => <li key={index}>{line.replace(/^\u2022\s*/, '')}</li>)}</ul></section>}</article> : <div className="project-folders">{projects.map(project => <a className="project-folder project-card-link" key={project.slug} href={`#projects/${project.slug}`} onClick={event => { event.preventDefault(); openProject(project.slug) }}><ProjectPreview/><div className="project-card-copy">{project.date !== 'Date not listed' && <span className="project-card-date">{project.date}</span>}<strong>{project.title.replace(/\s*-\s*(WARG|WATonomous)$/, "")}</strong><span className="project-card-stack">{project.tech.split(',').slice(0, 3).join(' / ')}</span><span className="project-open-button">View project</span></div></a>)}</div>)}{tab === 'Technical Skills' && <div className="technical-skills">{profile.skills.split(/\n\s*\n/).map(block => { const [category, ...lines] = block.split('\n'); return <section className="skill-category" key={category}><h2>{category}</h2><div className="skill-grid">{lines.join(', ').split(',').map(name => name.trim()).filter(Boolean).map(name => <div className="skill-item" key={name}><SkillIcon name={name}/><span>{name}</span></div>)}</div></section> })}</div>}{tab === 'Experience' && <div className="experience-groups">{[{ heading: 'Work', team: false }, { heading: 'Design Teams', team: true }].map(group => { const content = profile.experience.split(/\n\s*\n/).filter(block => /WARG|WATonomous/.test(block) === group.team).join('\n\n'); return content && <section className="experience-group" key={group.heading}><h2 className="experience-group-title">{group.heading}</h2>{entries(content, group.heading)}</section> })}</div>}{tab === 'Extracurriculars' && <>{profile.extracurriculars && entries(profile.extracurriculars,'Activities')}<div className="gallery">{profile.gallery.map((photo,i) => <img key={i} src={photo} alt={`Personal photo ${i+1}`}/>)}</div></>}
            {tab === 'Certifications' && <div className="certifications-list">{profile.certifications.map(cert => <article className="certification-card" key={cert.title}><div className="certificate-symbol"><Icon name="Certifications" size={32}/></div><div className="certificate-copy">{cert.issuer && <p className="certificate-issuer">{cert.issuer}</p>}<h2>{cert.title}</h2>{cert.date && <p className="certificate-date">{cert.date}</p>}<p>{cert.description}</p>{cert.url && <a className="certificate-link" href={cert.url} target="_blank" rel="noreferrer">View certificate</a>}</div></article>)}</div>}
            {tab === 'Resume' && <div className="resume-content">{profile.resume ? <><div className="resume-document"><Icon name="Resume" size={40}/><div><h2>{profile.name} - Resume</h2><p>PDF document</p></div><a className="primary" href={profile.resume} download={`${profile.name.replaceAll(' ','-')}-Resume.pdf`}>Download PDF ↓</a></div><object data={profile.resume} type="application/pdf" aria-label="Resume PDF" className="pdf-viewer"><p>Use Download PDF to view the resume.</p></object></> : <div className="empty-state"><Icon name="Resume" size={45}/><h2>Resume coming soon</h2></div>}</div>}
            {tab === 'Contact' && <div className="contact-content"><a className="contact-email" href={`mailto:${profile.email}`}><Icon name="Contact" size={28}/>{profile.email}</a><div className="about-socials">{social('GitHub',profile.github)}{social('LinkedIn',profile.linkedin)}</div><p className="contact-location">{profile.location}, Canada</p><ContactForm email={profile.email}/></div>}
          </>}
      </main></div><div className="win-status"><span>{tab === 'About' ? 'About' : tab}</span><span><a href="https://icons8.com/icons/fluency" target="_blank" rel="noreferrer">App icons by Icons8</a></span></div></section> : !windowControls.minimized && <button className="reopen-window" onClick={() => navigate('About')}><Icon name="About" size={30}/>Open About</button>}
      {startOpen && <section className="win-start" aria-label="Start menu"><form className="start-search" onSubmit={findSection}><Icon name="Search" size={17}/><input aria-label="Find a portfolio section" placeholder="Find a section" value={search} onChange={e => setSearch(e.target.value)}/><button type="submit" aria-label="Search">→</button></form>{searchMessage && <p role="status">{searchMessage}</p>}<h2>Pinned</h2><div className="start-app-grid">{tabs.map(item => <button key={item} onClick={() => navigate(item)}><Icon name={item} size={25}/><span>{item === 'About' ? 'About' : item}</span></button>)}</div><button className="start-lock" onClick={() => { setLocked(true); setStartOpen(false) }}>Lock screen</button></section>}
      {settingsOpen && <QuickSettings close={() => setSettingsOpen(false)} brightness={brightness} setBrightness={setBrightness} night={night} setNight={setNight} energy={energy} setEnergy={setEnergy} accessible={accessible} setAccessible={setAccessible}/>}
      <footer className="win-taskbar"><div className="win-taskbar-apps"><button aria-label="Open Start menu" aria-expanded={startOpen} onClick={() => { setStartOpen(!startOpen); setSettingsOpen(false) }}><img src="/icons/windows.svg" alt="" className="win-logo"/></button>{([...new Set<Tab>(['About','Technical Skills','Projects','Resume', ...(windowControls.minimized ? [tab] : [])])]).map(item => <button key={item} onClick={() => { if (tab === item && windowOpen) windowControls.minimize(); else if (tab === item && windowControls.minimized) windowControls.restore(); else navigate(item) }} className={tab === item && (windowOpen || windowControls.minimized) ? `task-selected ${windowControls.minimized ? 'task-is-minimized' : ''}` : ''} aria-label={tab === item && windowControls.minimized ? `Restore ${item}` : `Open ${item}`} title={item}><Icon name={item} size={23}/>{tab === item && windowControls.minimized && <span className="minimized-preview"><span className="minimized-preview-title"><Icon name={item} size={17}/>{activeProject ? activeProject.title : item}</span><span className="minimized-preview-body"><Icon name={item} size={37}/><span>Minimized</span></span><span className="minimized-preview-hint">Click to restore</span></span>}</button>)}<span className="task-separator"/>{(['GitHub','LinkedIn'] as const).map(label => { const url = label === 'GitHub' ? profile.github : profile.linkedin; return url ? <a key={label} href={url} aria-label={label} target="_blank" rel="noreferrer"><Icon name={label} size={23}/></a> : null })}<a href={`mailto:${profile.email}`} aria-label="Email"><Icon name="Contact" size={23}/></a></div><div className="system-tray"><button className="tray-icons" aria-label="Open quick settings" aria-expanded={settingsOpen} onClick={() => { setSettingsOpen(!settingsOpen); setStartOpen(false) }}><Icon name="Wifi" size={17}/><Icon name="Sound" size={17}/><Icon name="Battery" size={20}/></button><div><time>{timeLabel}</time><time>{dateLabel}</time></div></div></footer>
    </div>

  </>
}
export default App





