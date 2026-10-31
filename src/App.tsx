import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from 'react'
import './App.css'
import resumeProfile from './profile.json'
import { ProjectPhotos } from './ProjectPhotos'
import { TelemetryReport } from './TelemetryReport'
import { RobotNavigationReport } from './RobotNavigationReport'
import { EmergencyAbortReport } from './EmergencyAbortReport'
import { useWindowControls } from './useWindowControls'
import { ContactForm } from './ContactForm'
import { QuickSettings } from './QuickSettings'
import { matchSections } from './sectionSearch'

const tabs = ['About', 'Projects', 'Technical Skills', 'Experience', 'Extracurriculars', 'Certifications', 'Resume', 'Portfolio', 'Education', 'Contact'] as const
type Tab = typeof tabs[number]
type PortfolioItem = { id: string; title: string; description: string; url: string; image: string }
type Certification = { title: string; issuer: string; date: string; description: string; url: string }
type Profile = { name: string; email: string; location: string; intro: string; about: string; skills: string; projects: string; experience: string; extracurriculars: string; github: string; linkedin: string; photo: string; gallery: string[]; resume: string; portfolioPdf?: string; portfolio: PortfolioItem[]; contentVersion: number; certifications: Certification[]; projectRepositories: Record<string, string> }
const initial: Profile = resumeProfile
const projects = initial.projects.split(/\n\s*\n/).filter(Boolean).map((block, index) => {
 const [title, date, tech, ...description] = block.split('\n')
 return { title, date, tech, description, index, repository: initial.projectRepositories[title], slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
})
function readRoute() {
 const [section, slug] = window.location.hash.slice(1).split('/')
 const tab = tabs.find(item => item.toLowerCase().replaceAll(' ', '-') === section) || 'About'
 return { tab, slug: tab === 'Projects' && projects.some(project => project.slug === slug) ? slug : null }
}
const skillIcons: Record<string, string> = {
 Java: 'java', Python: 'python', 'C++': 'cplusplus', SQL: 'sql', HTML: 'html5', CSS: 'css3', TypeScript: 'typescript', JavaScript: 'javascript',
 React: 'react', 'Spring Boot': 'spring', PyTorch: 'pytorch', TensorFlow: 'tensorflow', 'scikit-learn': 'scikitlearn', OpenCV: 'opencv', 'ROS 2': 'ros', pandas: 'pandas', NumPy: 'numpy',
 'Arduino UNO': 'arduino', 'Arduino IDE': 'arduino', 'Java 21': 'java', Git: 'git', GitHub: 'github', Docker: 'docker', PyCharm: 'pycharm', Eclipse: 'eclipse', Vite: 'vitejs', 'Chrome DevTools': 'chrome', 'VS Code': 'vscode', PostgreSQL: 'sql', PyTest: 'pytest', YAML: 'yaml',
}
function SkillIcon({ name }: { name: string }) {
  const [failed, setFailed] = useState(false)
  const normalized = name.trim().toLowerCase()
  const key = Object.keys(skillIcons).find(skill => skill.toLowerCase() === normalized)
  const icon = key ? skillIcons[key] : undefined
  const paths: Record<string, string> = {
    Marketing: 'M3 20h18M6 16v-4m6 4V9m6 7V5M4 8l6-4 5 2 5-4',
    'Public speaking': 'm3 9 13-5v16L3 15V9Zm0 0v6h5l2 6h3l-2-7m8-6 3-2m-3 10 3 2',
    Innovation: 'M9 18h6m-6 3h6M8 14a6 6 0 1 1 8 0l-1 3H9l-1-3Z',
    Improvisation: 'm13 2-9 12h7l-1 8 10-13h-7l0-7Z',
    Leadership: 'M12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6M5 21v-3a7 7 0 0 1 14 0v3M3 8v8m18-8v8',
    Communication: 'M3 4h18v12H9l-6 5V4Zm4 4h10M7 12h7',
    Teaching: 'M4 4h16v12H4V4Zm5 5 3 3 5-5M8 21l4-5 4 5',
    Teamwork: 'M8 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6m8 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6M2 21v-3a6 6 0 0 1 12 0v3m0-8a6 6 0 0 1 8 5v3',
    'Machine learning': 'M8 3h8v5H8V3ZM3 16h6v5H3v-5Zm12 0h6v5h-6v-5ZM12 8v4M6 16v-4h12v4',
    'Customer service': 'M4 13v-2a8 8 0 0 1 16 0v2M4 12H2v6h4v-6H4Zm16 0h2v6h-4v-6h2Zm0 6v3h-7',
    'Event planning': 'M4 5h16v16H4V5Zm4-3v6m8-6v6M4 11h16m-12 4h3m3 0h2',
    Adaptability: 'M4 8a8 8 0 0 1 14-3l3 3M21 3v5h-5M20 16a8 8 0 0 1-14 3l-3-3m0 5v-5h5',
    Discipline: 'M5 4h14v17H5V4Zm4-2h6v4H9V2Zm0 12 2 2 4-5',
    Performance: 'M9 18V5l11-2v13M9 18c0 4-7 4-7 0s7-4 7 0m11-2c0 4-7 4-7 0s7-4 7 0',
    Organization: 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',
    Design: 'm4 20 3-8L18 1l5 5-11 11-8 3Zm3-8 5 5M3 3h6M3 3v6',
    Adobe: 'M2 21 9 3h6l7 18h-5l-5-13-3 9h5l2 4H2Z',
    'Attention to detail': 'M15 15l6 6M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14m-3 7 2 2 4-4',
    ArduPilot: 'M12 2v20M3 8l9 4 9-4M5 19l7-4 7 4M8 4h8',
    MAVROS: 'M8 3h8v5H8V3ZM3 16h6v5H3v-5Zm12 0h6v5h-6v-5ZM12 8v4M6 16v-4h12v4',
    MAVLink: 'M8 8 5 5a3 3 0 0 0-4 4l5 5a3 3 0 0 0 4 0m4 2 3 3a3 3 0 0 0 4-4l-5-5a3 3 0 0 0-4 0m-4-2 8 8',
    SQL: 'M20 5c0 2-16 2-16 0s16-2 16 0Zm-16 0v14c0 2 16 2 16 0V5M4 12c0 2 16 2 16 0',
    'Signal Processing': 'M2 12h3l3-8 5 16 3-8h6',
    I2C: 'M3 7h18M3 17h18M7 4v6m10 4v6M7 14v6m10-16v6',
    UART: 'M3 8h14m-3-3 3 3-3 3M21 16H7m3-3-3 3 3 3',
    'Serial Communication': 'M3 8h14m-3-3 3 3-3 3M21 16H7m3-3-3 3 3 3',
    ADC: 'M2 16h5v-5h5V7h5V3h5M2 21h20',
    'Embedded Programming': 'M6 6h12v12H6V6Zm3-4v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4M9 9h6v6H9V9Z',
  }
  const pathKey = Object.keys(paths).find(skill => skill.toLowerCase() === normalized)
  if (name === 'SQL' || pathKey || !icon || failed) return <svg className="skill-symbol" width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={(pathKey ? paths[pathKey] : undefined) || 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18'}/></svg>
  return <img className={['github','ros'].includes(icon) ? 'tech-icon tech-icon-light' : 'tech-icon'} src={`/icons/tech/${icon}.svg`} alt="" width="28" height="28" onError={() => setFailed(true)}/>
}
function TeamBadge({ name }: { name: string }) {
 const team = name.includes('WATonomous') ? 'WATonomous' : name.includes('WARG') ? 'WARG' : null
 if (!team) return null
 return <span className="team-logo-badge"><img src={team === 'WARG' ? '/icons/warg.png' : '/icons/watonomous.png'} alt="" width="36" height="28"/><span>{team}</span></span>
}
function ProjectPreview({ title }: { title: string }) {
 if (title === 'Computer Vision Food Recognition & Nutritional Analysis') return <div className="project-image-space website-project-preview food-project-preview"><img src="/projects/food-health/food-health-checker.png" alt="Food Health Checker showing live egg detection and nutrition facts" width="1307" height="847" loading="lazy"/></div>

 if (title === 'Emergency Abort System - WARG') return <div className="project-image-space website-project-preview abort-project-preview"><div className="abort-cover-crop"><img src="/projects/emergency-abort/abort-command-handling.png" alt="Airside logs receiving an ABORT command and entering abort handling" loading="lazy"/></div></div>

 if (title === 'Autonomous Robot Navigation & LiDAR Mapping - WATonomous') return <div className="project-image-space website-project-preview"><img src="/projects/robot-navigation/navigation-preview.jpg" alt="Foxglove view of the robot navigating a mapped obstacle arena" loading="lazy"/></div>
 if (title === 'ROS 2 Behaviour Tree Telemetry Reporter - WARG') return <div className="project-image-space website-project-preview"><img src="/projects/ros2-telemetry/takeoff-to-waypoint.png" alt="Mission Planner receiving behaviour telemetry during simulation" loading="lazy"/></div>
 if (title === 'Bedside Patient Monitoring System') return <div className="project-image-space website-project-preview bedside-project-preview"><img src="/projects/bedside-monitor/oled-pulse-sensor-wiring.jpeg" alt="Arduino bedside monitor wiring prototype" loading="lazy"/></div>
 if (title === 'Personal Website Windows UI Inspired') return <div className="project-image-space website-project-preview"><img src="/projects/personal-website/desktop.png" alt="Windows-inspired personal portfolio preview" width="1536" height="960" loading="lazy"/></div>
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
    About: '/icons/section-about.png',
    Portfolio: '/icons/section-portfolio.png',
    Projects: '/icons/explorer.png',
    Resume: '/icons/word.png',
    Certifications: '/icons/certification-award.svg',
    Education: '/icons/waterloo-crest.svg',
    Experience: '/icons/section-experience.png',
    'Technical Skills': '/icons/section-skills.png',
    Extracurriculars: '/icons/section-activities.png',
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
  function findSection(e: FormEvent) { e.preventDefault(); const found = search.trim() ? matchSections(tabs, search)[0] : undefined; if (found) { navigate(found); setSearch(''); setSearchMessage('') } else { setSearchMessage(search.trim() ? 'No matching section. Try Projects, Skills, Resume, or Contact' : 'Enter a section name') } }
  function searchNavigation(e: FormEvent) { e.preventDefault(); const found = navSearch.trim() ? matchSections(tabs, navSearch)[0] : undefined; if (found) navigate(found) }
  const [locked, setLocked] = useState(() => new URLSearchParams(window.location.search).get('message') !== 'submitted')
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
  const { frame: windowFrameRef, ...windowControls } = useWindowControls()
  const unlockWithSpace = useEffectEvent((event: KeyboardEvent) => {
    if (event.code !== 'Space' || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return
    const target = event.target
    if (target instanceof HTMLElement && target.closest('input,textarea,select,[contenteditable="true"]')) return
    event.preventDefault()
    unlock()
  })
  useEffect(() => {
    if (!locked) return
    window.addEventListener('keydown', unlockWithSpace)
    return () => window.removeEventListener('keydown', unlockWithSpace)
  }, [locked])
  const windowOpen = windowControls.visible
  const maximized = windowControls.maximized
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setSettingsOpen(false); setStartOpen(false); setNavOpen(false) } }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close) }, [])
  const [now, setNow] = useState(new Date())
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 30000); return () => window.clearInterval(timer) }, [])
  function navigate(next: Tab) { setTab(next); setNavSearch(''); setSearch(''); setSearchMessage(''); setProjectSlug(null); setNavOpen(false); windowControls.restore(); setStartOpen(false); window.history.pushState(null, '', `#${next.toLowerCase().replaceAll(' ', '-')}`); window.scrollTo({ top: 0 }) }
  function openProject(slug: string) { setTab('Projects'); setProjectSlug(slug); windowControls.restore(); window.history.pushState(null, '', `#projects/${slug}`); window.scrollTo({ top: 0 }) }
  const social = (label: string, url: string) => url ? <a className="social-link" href={url} target="_blank" rel="noreferrer">{label}</a> : <span className="social-link unavailable">{label}<small>Not added yet</small></span>
  const entries = (value: string, label: string) => value.trim() ? <div className="resume-entries">{value.trim().split(/\n\s*\n/).map((block, index) => {
    const [title, ...body] = block.split('\n').filter(Boolean)
    const bullets = body.filter(line => line.startsWith('•'))
    const softSkills = body.find(line => line.startsWith('Skills: '))?.slice(8)
    return <article key={index}><div className="entry-title-row">{label === "Design Teams" && <TeamBadge name={title}/>}<h2>{title}</h2></div>{body.filter(line => !line.startsWith('•') && !line.startsWith('Skills: ')).map((line, i) => <p key={i}>{line}</p>)}{softSkills && <div className="entry-strengths" aria-label="Soft skills"><ul>{softSkills.split(',').map(skill => <li key={skill.trim()} className="activity-skill-token"><span>{skill.trim().toUpperCase()}</span></li>)}</ul></div>}{bullets.length > 0 && <ul>{bullets.map((line, i) => <li key={i}>{line.replace(/^•\s*/, '')}</li>)}</ul>}{label === 'Activities' && title.includes('DECA') && <div className="activity-pdf"><div className="activity-pdf-title"><Icon name="Resume" size={32}/><div><h3>Bayview DECA Business Report</h3><span>PDF document</span></div></div><div className="activity-pdf-actions"><a className="primary" href="/Bayview-DECA-Business-Report.pdf" target="_blank" rel="noreferrer">View Report (PDF)</a><a className="secondary" href="/Bayview-DECA-Business-Report.pdf" download>Download PDF</a></div></div>}</article>
  })}</div> : <div className="empty-state"><h2>No {label.toLowerCase()} added yet</h2></div>
  const dateParts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Toronto' }).formatToParts(now)
  const dateValue = (part: string) => dateParts.find(p => p.type === part)?.value || ''
  const dateLabel = `${dateValue('year')}-${dateValue('month')}-${dateValue('day')}`
  const lockDateParts = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Toronto' }).formatToParts(now)
  const lockPart = (type: string) => lockDateParts.find(part => part.type === type)?.value || ''
  const lockDateLabel = `${lockPart('weekday')}, ${lockPart('day')} ${lockPart('month')}`
  const timeLabel = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Toronto' })
  if (locked) return <main className={`lock-screen ${unlocking ? "lock-exiting" : ""}`}><div className="lock-clock"><time>{timeLabel}</time><p>{lockDateLabel}</p></div><section className="lock-account">{profile.photo && <div className="lock-avatar"><img src={profile.photo} alt={profile.name}/></div>}<h1>Aiden Zhang</h1><p className="lock-degree">Computer Engineering at University of Waterloo</p><button className="primary" onClick={unlock} disabled={unlocking}>Enter <span aria-hidden="true">→</span></button></section><div className="lock-tray"><Icon name="Wifi" size={20}/><Icon name="Sound" size={20}/><Icon name="Battery" size={23}/></div></main>
  return <>
    <a href="#main" className="skip">Skip to content</a>
    <div className={`win-desktop ${night ? "night-light" : ""} ${energy ? "energy-saver" : ""} ${accessible ? "large-text" : ""}`}>
      <div className="desktop-apps" aria-label="Desktop shortcuts">{(['About','Projects','Technical Skills','Resume','Portfolio'] as const).map(item => <button key={item} onClick={() => navigate(item)}><span className="desktop-app-icon"><Icon name={item} size={29}/></span><span>{item === 'About' ? 'About' : item}</span></button>)}</div>
      {windowOpen ? <section ref={windowFrameRef} style={{ ...windowControls.style, filter: `brightness(${brightness / 100})` }} className={`win-window ${maximized ? 'win-maximized' : ''} ${windowControls.floating ? 'win-floating' : ''} ${windowControls.minimizing ? 'win-minimizing' : ''} ${windowControls.dragging ? 'win-dragging' : ''}`} aria-label="Portfolio window"><header className="win-titlebar" tabIndex={0} aria-label="Window title bar. Drag to move, or use Alt and arrow keys." onPointerDown={windowControls.pointerDown} onPointerMove={windowControls.pointerMove} onPointerUp={windowControls.pointerUp} onPointerCancel={windowControls.pointerUp} onKeyDown={windowControls.keyDown} onDoubleClick={event => { if (!(event.target as HTMLElement).closest('button')) windowControls.toggleMaximized() }}><span><Icon name={tab} size={16}/>{tab === 'About' ? 'About' : tab}</span><div className="win-controls"><button aria-label="Minimize window" onClick={windowControls.minimize}><svg className="window-control-icon" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6.5h10"/></svg></button><button aria-label={maximized ? 'Restore window' : 'Maximize window'} onClick={windowControls.toggleMaximized}><svg className="window-control-icon" viewBox="0 0 12 12" aria-hidden="true">{maximized ? <path d="M3.5 3.5V1.5h7v7h-2m-7-5h7v7h-7z"/> : <rect x="1.5" y="1.5" width="9" height="9"/>}</svg></button><button className="win-close" aria-label="Close window" onClick={windowControls.close}><svg className="window-control-icon" viewBox="0 0 12 12" aria-hidden="true"><path d="m2 2 8 8m0-8-8 8"/></svg></button></div></header>
      <div className="win-toolbar"><button className="mobile-menu-toggle" aria-label="Toggle navigation" aria-expanded={navOpen} aria-controls="portfolio-sidebar" onClick={() => setNavOpen(!navOpen)}><span/><span/><span/></button><button className="win-back" aria-label={activeProject ? "Back to projects" : "Open About"} onClick={() => navigate(activeProject ? 'Projects' : 'About')}>←</button><div className="win-breadcrumb"><Icon name="Portfolio" size={16}/><span>Portfolio</span><span>›</span><span>{tab}</span>{activeProject && <><span>&rsaquo;</span><span className="breadcrumb-project">{activeProject.title}</span></>}</div></div>
      <div className="win-body"><aside id="portfolio-sidebar" className={`win-sidebar ${navOpen ? "navigation-open" : ""}`}><span className="nav-heading">PORTFOLIO</span><form className="sidebar-search" onSubmit={searchNavigation}><Icon name="Search" size={15}/><input aria-label="Filter navigation" placeholder="Find a section" value={navSearch} onChange={e => setNavSearch(e.target.value)} type="search"/><button className="sidebar-search-go" type="submit" aria-label="Open matching section"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><path d="M2 8h12m-5-5 5 5-5 5"/></svg></button></form><nav aria-label="Portfolio sections">{matchSections(tabs, navSearch).map(item => <button key={item} onClick={() => navigate(item)} aria-current={item === tab ? 'page' : undefined}><Icon name={item} size={18}/><span>{item}</span></button>)}</nav>{!matchSections(tabs, navSearch).length && <p className="nav-no-results">No matching sections.</p>}<button className="sidebar-email" onClick={() => navigate('Contact')}><Icon name="Contact" size={15}/><span>Leave a message</span></button></aside>
      <main id="main" className="win-content" key={`${tab}:${projectSlug || "index"}`}>
          {tab === 'About' ? <><section className="plain-about"><div className="identity-kicker"><span/>PERSONAL PORTFOLIO</div>{profile.photo && <img className="plain-portrait" src={profile.photo} alt={profile.name}/>}<h1 className="pixel-name" aria-label={profile.name}>{Array.from(profile.name).map((letter, index) => <span key={index} aria-hidden="true" style={{ animationDelay: `${index * 45}ms` }}>{letter === " " ? "\u00a0" : letter}</span>)}</h1><p className="education-intro">University of Waterloo <span>Computer Engineering with Co-op</span></p><p className="internship-line"><span/>Seeking Summer 2027 Co-op</p><div className="identity-meta"><span>{profile.location}</span><a href={`mailto:${profile.email}`}>{profile.email}</a></div>{profile.intro && <p>{profile.intro}</p>}{profile.about && <p>{profile.about}</p>}<div className="identity-links"><button onClick={() => navigate('Projects')}>View Projects</button><button onClick={() => navigate('Resume')}>View Resume (PDF)</button><button onClick={() => navigate('Portfolio')}>View Portfolio (PDF)</button></div><div className="identity-bottom"><div className="identity-socials"><a href={profile.github} target="_blank" rel="noreferrer"><Icon name="GitHub" size={18}/>GitHub</a><a href={profile.linkedin} target="_blank" rel="noreferrer"><Icon name="LinkedIn" size={18}/>LinkedIn</a></div><span className="identity-small">&copy; 2026 Aiden Zhang</span></div></section>
          </> : <><div className="page-eyebrow">PORTFOLIO / {tab.toUpperCase()}</div><div className="page-heading"><span className="page-icon"><Icon name={tab} size={30}/></span><div><h1>{activeProject ? activeProject.title : tab}</h1></div></div>
            {tab === 'Education' && <div className="education-list"><article className="education-card"><a className="waterloo-logo-link" href="https://uwaterloo.ca/engineering/" target="_blank" rel="noreferrer" aria-label="University of Waterloo Engineering"><img className="waterloo-logo waterloo-crest" src="/icons/waterloo-crest.svg" alt="University of Waterloo"/></a><div className="education-copy"><h2>University of Waterloo</h2><p className="education-degree">BASc, Honours Computer Engineering</p><p className="education-dates">September 2026 - May 2031</p></div></article><article className="school-card bayview-education"><a className="bayview-logo-link" href="https://bayview-ss.yrdsb.ca/" target="_blank" rel="noreferrer" aria-label="Bayview Secondary School"><img src="/icons/bayview-stuco.png" alt="Bayview tiger" className="bayview-logo" width="80" height="80"/></a><div><span className="school-period">2022 - 2026</span><h2>Bayview Secondary School</h2><p className="school-honour">Honour Roll Student</p></div></article></div>}
            {tab === 'Portfolio' && <div className="resume-content"><div className="resume-document"><Icon name="Portfolio" size={40}/><div className="resume-document-title"><h2>Portfolio PDF</h2><p>PDF document</p></div><div className="resume-pdf-actions">{profile.portfolioPdf ? <><a className="secondary" href={profile.portfolioPdf} target="_blank" rel="noreferrer">Open PDF</a><a className="primary" href={profile.portfolioPdf} download={`${profile.name.replaceAll(' ','-')}-Portfolio.pdf`}>Download PDF ?</a></> : <><button className="secondary" disabled>Open PDF</button><button className="primary" disabled>Download PDF ?</button></>}</div></div>{profile.portfolioPdf && <object data={profile.portfolioPdf} type="application/pdf" aria-label="Portfolio PDF" className="pdf-viewer"><p>Use Open PDF to view the portfolio in a new tab.</p></object>}</div>}
            {tab === 'Projects' && (activeProject ? <article className="project-screen"><button className="project-back-link" onClick={() => navigate('Projects')}>Back to projects</button>{activeProject.date !== 'Date not listed' && <p className="project-screen-date">{activeProject.date}</p>}<div className="project-tech-tiles"><TeamBadge name={activeProject.title}/>{activeProject.tech.split(',').map(name => name.trim()).filter(Boolean).map(name => <span className="skill-item" key={name}><SkillIcon name={name}/><span>{name}</span></span>)}</div>{activeProject.title === 'ROS 2 Behaviour Tree Telemetry Reporter - WARG' && <TelemetryReport/>}{activeProject.title === 'Autonomous Robot Navigation & LiDAR Mapping - WATonomous' && <RobotNavigationReport/>}{activeProject.title === 'Emergency Abort System - WARG' && <EmergencyAbortReport/>}<ProjectPhotos title={activeProject.title}/>{activeProject.description.length > 0 && activeProject.title !== 'ROS 2 Behaviour Tree Telemetry Reporter - WARG' && activeProject.title !== 'Autonomous Robot Navigation & LiDAR Mapping - WATonomous' && activeProject.title !== 'Emergency Abort System - WARG' && <section className="project-overview"><h2>Project details</h2><ul>{activeProject.description.map((line, index) => <li key={index}>{line.replace(/^\u2022\s*/, '')}</li>)}</ul></section>}{activeProject.repository && <div className="project-source"><a className="project-github-link" href={activeProject.repository} target="_blank" rel="noreferrer"><Icon name="GitHub" size={21}/><span>View source on GitHub</span></a></div>}</article> : <div className="project-folders">{projects.map(project => <a className="project-folder project-card-link" key={project.slug} href={`#projects/${project.slug}`} onClick={event => { event.preventDefault(); openProject(project.slug) }}><ProjectPreview title={project.title}/><div className="project-card-copy">{project.date !== 'Date not listed' && <span className="project-card-date">{project.date}</span>}<strong>{project.title.replace(/\s*-\s*(WARG|WATonomous)$/, "")}</strong><span className="project-card-stack">{project.tech.split(',').slice(0, 3).join(' / ')}</span><span className="project-open-button">View project</span></div></a>)}</div>)}{tab === 'Technical Skills' && <div className="technical-skills">{profile.skills.split(/\n\s*\n/).map(block => { const [category, ...lines] = block.split('\n'); return <section className="skill-category" key={category}><h2>{category}</h2><div className="skill-grid">{lines.join(', ').split(',').map(name => name.trim()).filter(Boolean).map(name => <div className="skill-item" key={name}><SkillIcon name={name}/><span>{name}</span></div>)}</div></section> })}</div>}{tab === 'Experience' && <div className="experience-groups">{[{ heading: 'Work', team: false }, { heading: 'Design Teams', team: true }].map(group => { const content = profile.experience.split(/\n\s*\n/).filter(block => /WARG|WATonomous/.test(block) === group.team).join('\n\n'); return content && <section className="experience-group" key={group.heading}><h2 className="experience-group-title">{group.heading}</h2>{entries(content, group.heading)}</section> })}</div>}{tab === 'Extracurriculars' && <>{profile.extracurriculars && entries(profile.extracurriculars,'Activities')}<div className="gallery">{profile.gallery.map((photo,i) => <img key={i} src={photo} alt={`Personal photo ${i+1}`}/>)}</div></>}
            {tab === 'Certifications' && <div className="certifications-list">{profile.certifications.map(cert => <article className="certification-card" key={cert.title}><div className="certificate-symbol"><Icon name="Certifications" size={32}/></div><div className="certificate-copy">{cert.issuer && <p className="certificate-issuer">{cert.issuer}</p>}<h2>{cert.title}</h2>{cert.date && <p className="certificate-date">{cert.date}</p>}<p>{cert.description}</p>{cert.url && <a className="certificate-link" href={cert.url} target="_blank" rel="noreferrer">View certificate</a>}</div></article>)}</div>}
            {tab === 'Resume' && <div className="resume-content">{profile.resume ? <><div className="resume-document"><Icon name="Resume" size={40}/><div className="resume-document-title"><h2>{profile.name} - Resume</h2><p>PDF document</p></div><div className="resume-pdf-actions"><a className="secondary" href={profile.resume} target="_blank" rel="noreferrer">Open PDF</a><a className="primary" href={profile.resume} download={`${profile.name.replaceAll(' ','-')}-Resume.pdf`}>Download PDF ↓</a></div></div><object data={profile.resume} type="application/pdf" aria-label="Resume PDF" className="pdf-viewer"><p>Use Download PDF to view the resume.</p></object></> : <div className="empty-state"><Icon name="Resume" size={45}/><h2>Resume coming soon</h2></div>}</div>}
            {tab === 'Contact' && <div className="contact-content"><a className="contact-email" href={`mailto:${profile.email}`}><Icon name="Contact" size={28}/>{profile.email}</a><div className="about-socials">{social('GitHub',profile.github)}{social('LinkedIn',profile.linkedin)}</div><p className="contact-location">{profile.location}, Canada</p><ContactForm email={profile.email}/></div>}
          </>}
      </main></div><div className="win-status"><span>&copy; 2026 Aiden Zhang</span><span><a href="https://icons8.com/icons/fluency" target="_blank" rel="noreferrer">App icons by Icons8</a></span></div></section> : !windowControls.minimized && <button className="reopen-window" onClick={() => navigate('About')}><Icon name="About" size={30}/>Open About</button>}
      {startOpen && <section className="win-start" aria-label="Start menu"><form className="start-search" onSubmit={findSection}><Icon name="Search" size={17}/><input aria-label="Find a portfolio section" autoFocus placeholder="Find a section" type="search" value={search} onChange={e => { setSearch(e.target.value); setSearchMessage('') }}/><button type="submit" aria-label="Search">→</button></form>{searchMessage && <p role="status">{searchMessage}</p>}<h2>{search.trim() ? 'Search results' : 'Pinned'}</h2>{search.trim() ? <div className="start-search-results" aria-live="polite">{matchSections(tabs, search).length ? matchSections(tabs, search).map((item, index) => <button className={index === 0 ? 'best-match' : ''} key={item} onClick={() => navigate(item)}><Icon name={item} size={30}/><span><strong>{item}</strong><small>{index === 0 ? 'Best match' : 'Portfolio section'}</small></span><span className="search-open-label">Open</span></button>) : <p className="start-no-results">No sections found. Try About, Projects, or Skills</p>}</div> : <div className="start-app-grid">{tabs.map(item => <button key={item} onClick={() => navigate(item)}><Icon name={item} size={25}/><span>{item}</span></button>)}</div>}<button className="start-lock" onClick={() => { setLocked(true); setStartOpen(false) }}>Lock screen</button></section>}
      {settingsOpen && <QuickSettings close={() => setSettingsOpen(false)} brightness={brightness} setBrightness={setBrightness} night={night} setNight={setNight} energy={energy} setEnergy={setEnergy} accessible={accessible} setAccessible={setAccessible}/>}
      <footer className="win-taskbar"><div className="win-taskbar-apps"><button aria-label="Open Start menu" aria-expanded={startOpen} onClick={() => { setStartOpen(!startOpen); setSettingsOpen(false) }}><img src="/icons/windows.svg" alt="" className="win-logo"/></button>{([...new Set<Tab>(['About','Technical Skills','Projects','Resume', ...(windowControls.minimized ? [tab] : [])])]).map(item => <button key={item} onClick={() => { if (tab === item && windowOpen) windowControls.minimize(); else if (tab === item && windowControls.minimized) windowControls.restore(); else navigate(item) }} className={tab === item && (windowOpen || windowControls.minimized) ? `task-selected ${windowControls.minimized ? 'task-is-minimized' : ''}` : ''} aria-label={tab === item && windowControls.minimized ? `Restore ${item}` : `Open ${item}`} title={item}><Icon name={item} size={23}/>{tab === item && windowControls.minimized && <span className="minimized-preview"><span className="minimized-preview-title"><Icon name={item} size={17}/>{activeProject ? activeProject.title : item}</span><span className="minimized-preview-body"><Icon name={item} size={37}/><span>Minimized</span></span><span className="minimized-preview-hint">Click to restore</span></span>}</button>)}<span className="task-separator"/>{(['GitHub','LinkedIn'] as const).map(label => { const url = label === 'GitHub' ? profile.github : profile.linkedin; return url ? <a key={label} href={url} aria-label={label} target="_blank" rel="noreferrer"><Icon name={label} size={23}/></a> : null })}<button onClick={() => navigate('Contact')} aria-label="Leave me a message" title="Contact"><Icon name="Contact" size={23}/></button></div><div className="system-tray"><button className="tray-icons" aria-label="Open quick settings" aria-expanded={settingsOpen} onClick={() => { setSettingsOpen(!settingsOpen); setStartOpen(false) }}><Icon name="Wifi" size={17}/><Icon name="Sound" size={17}/><Icon name="Battery" size={20}/></button><div><time>{timeLabel}</time><time>{dateLabel}</time></div></div></footer>
    </div>

  </>
}
export default App





