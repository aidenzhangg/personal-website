import { useEffect, useRef, useState, type FormEvent } from 'react'
import './App.css'
import resumeProfile from './profile.json'

const tabs = ['About', 'Technical Skills', 'Projects', 'Experience', 'Extracurriculars', 'Resume', 'Portfolio', 'Contact'] as const
type Tab = typeof tabs[number]
type PortfolioItem = { id: string; title: string; description: string; url: string; image: string }
type Profile = { name: string; email: string; location: string; intro: string; about: string; skills: string; projects: string; experience: string; extracurriculars: string; github: string; linkedin: string; photo: string; gallery: string[]; resume: string; portfolio: PortfolioItem[]; contentVersion: number }
const initial: Profile = resumeProfile
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
    Bluetooth: 'M12 2v20l7-6L5 6m0 12L19 8 12 2',
    Airplane: 'm22 12-8-3V4a2 2 0 0 0-4 0v5l-8 3v2l8-1v5l-2 2v1l4-1 4 1v-1l-2-2v-5l8 1v-2Z',
    Energy: 'M6 7h12v14H6V7Zm4-4h4v4m-2 3-3 5h4l-2 4',
    Brightness: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5',
    Accessibility: 'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4M4 9l8 2 8-2m-8 2v5m0 0-4 6m4-6 4 6',
    Controls: 'M3 6h18M3 12h18M3 18h18M8 3v6m8 0v6m-8 0v6',
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
  const [tab, setTab] = useState<Tab>('About')
  const [search, setSearch] = useState('')
  const [searchMessage, setSearchMessage] = useState('')
  function findSection(e: FormEvent) { e.preventDefault(); const found = tabs.find(item => (item === 'About' ? 'about' : item.toLowerCase()).includes(search.trim().toLowerCase())); if (found && search.trim()) { navigate(found); setSearchMessage('') } else { setSearchMessage('Choose About, Technical Skills, Projects, Experience, Extracurriculars, Resume, Portfolio, or Contact.'); } }
  const [locked, setLocked] = useState(true)
  const [unlocking, setUnlocking] = useState(false)
  const unlockTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(unlockTimer.current), [])
  function unlock() { if (unlocking) return; setUnlocking(true); const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; unlockTimer.current = window.setTimeout(() => { setLocked(false); setUnlocking(false); navigate('About') }, reducedMotion ? 0 : 520) }
  const [startOpen, setStartOpen] = useState(false)
  const [windowOpen, setWindowOpen] = useState(true)
  const [maximized, setMaximized] = useState(false)
  const [quickSettings, setQuickSettings] = useState(false)
  const [volume, setVolume] = useState(65)
  const [brightness, setBrightness] = useState(100)
  const [wifi, setWifi] = useState(true)
  const [bluetooth, setBluetooth] = useState(true)
  const [airplane, setAirplane] = useState(false)
  const [energy, setEnergy] = useState(false)
  const [night, setNight] = useState(false)
  const [accessible, setAccessible] = useState(false)
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setQuickSettings(false) }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close) }, [])
  const [now, setNow] = useState(new Date())
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 30000); return () => window.clearInterval(timer) }, [])
  function navigate(next: Tab) { setTab(next); setWindowOpen(true); setStartOpen(false); window.history.replaceState(null, '', `#${next.toLowerCase()}`); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const social = (label: string, url: string) => url ? <a className="social-link" href={url} target="_blank" rel="noreferrer">{label}<span>↗</span></a> : <span className="social-link unavailable">{label}<small>Not added yet</small></span>
  const entries = (value: string, label: string) => value.trim() ? <div className="resume-entries">{value.trim().split(/\n\s*\n/).map((block, index) => {
    const [title, ...body] = block.split('\n').filter(Boolean)
    const bullets = body.filter(line => line.startsWith('•'))
    return <article key={index}><h2>{title}</h2>{body.filter(line => !line.startsWith('•')).map((line, i) => <p key={i}>{line}</p>)}{bullets.length > 0 && <ul>{bullets.map((line, i) => <li key={i}>{line.replace(/^•\s*/, '')}</li>)}</ul>}</article>
  })}</div> : <div className="empty-state"><h2>No {label.toLowerCase()} added yet</h2></div>
  const dateParts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/Toronto' }).formatToParts(now)
  const dateValue = (part: string) => dateParts.find(p => p.type === part)?.value || ''
  const dateLabel = `${dateValue('year')}-${dateValue('month')}-${dateValue('day')}`
  const timeLabel = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Toronto' })
  if (locked) return <main className={`lock-screen ${unlocking ? "lock-exiting" : ""}`}><div className="lock-clock"><time>{timeLabel}</time><p>{dateLabel}</p></div><section className="lock-account">{profile.photo && <div className="lock-avatar"><img src={profile.photo} alt={profile.name}/></div>}<h1>Aiden’s <span>Portfolio</span></h1><button className="primary" onClick={unlock} disabled={unlocking}>Enter <span aria-hidden="true">→</span></button></section><div className="lock-tray"><Icon name="Wifi" size={20}/><Icon name="Sound" size={20}/><Icon name="Battery" size={23}/></div></main>
  return <>
    <a href="#main" className="skip">Skip to content</a>
    <div className={`win-desktop ${night ? "night-light" : ""} ${energy ? "energy-saver" : ""} ${accessible ? "large-text" : ""}`}>
      <div className="desktop-apps" aria-label="Desktop shortcuts">{(['About','Technical Skills','Projects','Resume','Portfolio'] as const).map(item => <button key={item} onClick={() => navigate(item)}><span className="desktop-app-icon"><Icon name={item} size={29}/></span><span>{item === 'About' ? 'About' : item}</span></button>)}</div>
      {windowOpen ? <section className={`win-window ${maximized ? 'win-maximized' : ''}`} aria-label="Portfolio window" style={{ filter: `brightness(${.35 + brightness * .0065})` }}><header className="win-titlebar"><span><Icon name={tab} size={16}/>{tab === 'About' ? 'About' : tab}</span><div className="win-controls"><button aria-label="Minimize window" onClick={() => setWindowOpen(false)}>─</button><button aria-label={maximized ? 'Restore window' : 'Maximize window'} onClick={() => setMaximized(!maximized)}>□</button><button className="win-close" aria-label="Close window" onClick={() => setWindowOpen(false)}>×</button></div></header>
      <div className="win-toolbar"><button className="win-back" aria-label="Open About" onClick={() => navigate('About')}>←</button><div className="win-breadcrumb"><Icon name="Portfolio" size={16}/><span>Portfolio</span><span>›</span><span>{tab === 'About' ? 'About' : tab}</span></div></div>
      <div className="win-body"><aside className="win-sidebar"><span className="nav-heading">PINNED</span><nav aria-label="Portfolio sections">{tabs.map(item => <button key={item} onClick={() => navigate(item)} aria-current={item === tab ? 'page' : undefined}><Icon name={item} size={18}/><span>{item === 'About' ? 'About' : item}</span></button>)}</nav><a className="sidebar-email" href={`mailto:${profile.email}`}><Icon name="Contact" size={15}/><span>Email</span></a></aside>
      <main id="main" className="win-content" key={tab}>
          {tab === 'About' ? <><section className="plain-about">{profile.photo && <img className="plain-portrait" src={profile.photo} alt={profile.name}/>}<h1 className="pixel-name" aria-label={profile.name}>{Array.from(profile.name).map((letter, index) => <span key={index} aria-hidden="true" style={{ animationDelay: `${index * 45}ms` }}>{letter === " " ? "\u00a0" : letter}</span>)}</h1>{profile.intro && <p>{profile.intro}</p>}{profile.about && <p>{profile.about}</p>}</section>
          </> : <><div className="page-eyebrow">PORTFOLIO / {tab.toUpperCase()}</div><div className="page-heading"><span className="page-icon"><Icon name={tab} size={30}/></span><div><h1>{tab}</h1><p>{tab === 'Portfolio' ? 'Work, images, and links' : tab === 'Projects' ? 'Selected work' : tab === 'Resume' ? 'Resume PDF' : tab === 'Contact' ? profile.location : tab === 'Technical Skills' ? 'Technical skills' : tab === 'Experience' ? 'Work and experience' : 'Activities and interests'}</p></div></div>
            {tab === 'Portfolio' && <><div className="portfolio-actions"><span>{profile.portfolio.length} {profile.portfolio.length === 1 ? 'item' : 'items'}</span></div>{profile.portfolio.length ? <div className="portfolio-grid">{profile.portfolio.map(item => <article className="portfolio-item" key={item.id}>{item.image && <img src={item.image} alt={item.title || 'Portfolio work'}/>}<div><h2>{item.title || 'Untitled'}</h2>{item.description && <p>{item.description}</p>}{/^https?:\/\//i.test(item.url) && <a href={item.url} target="_blank" rel="noreferrer">View work ↗</a>}</div></article>)}</div> : <div className="portfolio-empty"><Icon name="Portfolio" size={38}/><p>No portfolio work added yet.</p></div>}</>}
            {tab === 'Projects' && entries(profile.projects,'Projects')}{tab === 'Technical Skills' && entries(profile.skills,'Technical Skills')}{tab === 'Experience' && entries(profile.experience,'Experience')}{tab === 'Extracurriculars' && <>{entries(profile.extracurriculars,'Activities')}<div className="gallery">{profile.gallery.map((photo,i) => <img key={i} src={photo} alt={`Personal photo ${i+1}`}/>)}</div></>}
            {tab === 'Resume' && <div className="resume-content">{profile.resume ? <><div className="resume-document"><Icon name="Resume" size={40}/><div><h2>{profile.name} — Resume</h2><p>PDF document</p></div><a className="primary" href={profile.resume} download={`${profile.name.replaceAll(' ','-')}-Resume.pdf`}>Download PDF ↓</a></div><object data={profile.resume} type="application/pdf" aria-label="Resume PDF" className="pdf-viewer"><p>Use Download PDF to view the resume.</p></object></> : <div className="empty-state"><Icon name="Resume" size={45}/><h2>Resume coming soon</h2></div>}</div>}
            {tab === 'Contact' && <div className="contact-content"><a className="contact-email" href={`mailto:${profile.email}`}><Icon name="Contact" size={28}/>{profile.email}<span>↗</span></a><div className="about-socials">{social('GitHub',profile.github)}{social('LinkedIn',profile.linkedin)}</div><p className="contact-location">{profile.location}, Canada</p></div>}
          </>}
      </main></div><div className="win-status"><span>{tab === 'About' ? 'About' : tab}</span><span><a href="https://icons8.com/icons/fluency" target="_blank" rel="noreferrer">App icons by Icons8</a></span></div></section> : <button className="reopen-window" onClick={() => navigate('About')}><Icon name="About" size={30}/>Open About</button>}
      {startOpen && <section className="win-start" aria-label="Start menu"><form className="start-search" onSubmit={findSection}><Icon name="Search" size={17}/><input aria-label="Find a portfolio section" placeholder="Find a section" value={search} onChange={e => setSearch(e.target.value)}/><button type="submit" aria-label="Search">→</button></form>{searchMessage && <p role="status">{searchMessage}</p>}<h2>Pinned</h2><div className="start-app-grid">{tabs.map(item => <button key={item} onClick={() => navigate(item)}><Icon name={item} size={25}/><span>{item === 'About' ? 'About' : item}</span></button>)}</div><button className="start-lock" onClick={() => { setLocked(true); setStartOpen(false); setQuickSettings(false) }}>Lock screen</button></section>}
      {quickSettings && <><button className="quick-dismiss" aria-label="Close quick settings" onClick={() => setQuickSettings(false)}/><section className="quick-settings windows-quick" aria-label="Quick settings"><div className="quick-top"><span>Quick settings</span><button aria-label="Close quick settings" onClick={() => setQuickSettings(false)}>×</button></div><div className="quick-grid">
        <div className="quick-tile"><button aria-label="Toggle Wi-Fi indicator" aria-pressed={wifi && !airplane} className={wifi && !airplane ? 'enabled' : ''} onClick={() => { setWifi(!wifi); setAirplane(false) }}><Icon name="Wifi" size={21}/></button><span>Wi-Fi</span></div>
        <div className="quick-tile"><button aria-label="Toggle Bluetooth indicator" aria-pressed={bluetooth} className={bluetooth ? 'enabled' : ''} onClick={() => setBluetooth(!bluetooth)}><Icon name="Bluetooth" size={21}/></button><span>{bluetooth ? 'Not connected' : 'Bluetooth off'}</span></div>
        <div className="quick-tile"><button aria-label="Toggle airplane mode indicator" aria-pressed={airplane} className={airplane ? 'enabled' : ''} onClick={() => { setAirplane(!airplane); if (!airplane) { setWifi(false); setBluetooth(false) } }}><Icon name="Airplane" size={21}/></button><span>Airplane mode</span></div>
        <div className="quick-tile"><button aria-label="Reduce visual effects" aria-pressed={energy} className={energy ? 'enabled' : ''} onClick={() => setEnergy(!energy)}><Icon name="Energy" size={21}/></button><span>Energy saver</span></div>
        <div className="quick-tile"><button aria-label="Toggle warmer page colors" aria-pressed={night} className={night ? 'enabled' : ''} onClick={() => setNight(!night)}><Icon name="Brightness" size={21}/></button><span>Night light</span></div>
        <div className="quick-tile"><button aria-label="Toggle larger page text" aria-pressed={accessible} className={accessible ? 'enabled' : ''} onClick={() => setAccessible(!accessible)}><Icon name="Accessibility" size={21}/></button><span>Accessibility</span></div>
      </div><div className="quick-sliders"><label className="quick-range"><Icon name="Brightness" size={22}/><input type="range" min="0" max="100" aria-label="Portfolio brightness" value={brightness} onChange={e => setBrightness(Number(e.target.value))} style={{ background: `linear-gradient(to right, #b2374e ${brightness}%, #777 ${brightness}%)` }}/></label><label className="quick-range"><button type="button" aria-label={volume ? 'Mute interface volume' : 'Unmute interface volume'} onClick={() => setVolume(volume ? 0 : 65)}><Icon name="Sound" size={22}/>{volume === 0 && <span className="mute-mark">×</span>}</button><input type="range" min="0" max="100" aria-label="Interface volume" value={volume} onChange={e => setVolume(Number(e.target.value))} style={{ background: `linear-gradient(to right, #b2374e ${volume}%, #777 ${volume}%)` }}/><Icon name="Controls" size={20}/></label></div><div className="quick-bottom"><span title="Battery indicator"><Icon name="Battery" size={23}/></span></div></section></>}
      <footer className="win-taskbar"><div className="win-taskbar-apps"><button aria-label="Open Start menu" aria-expanded={startOpen} onClick={() => { setStartOpen(!startOpen); setQuickSettings(false) }}><img src="/icons/windows.svg" alt="" className="win-logo"/></button>{(['About','Technical Skills','Projects','Resume'] as const).map(item => <button key={item} onClick={() => navigate(item)} className={windowOpen && tab === item ? 'task-selected' : ''} aria-label={`Open ${item}`} title={item}><Icon name={item} size={23}/></button>)}<span className="task-separator"/>{(['GitHub','LinkedIn'] as const).map(label => { const url = label === 'GitHub' ? profile.github : profile.linkedin; return url ? <a key={label} href={url} aria-label={label} target="_blank" rel="noreferrer"><Icon name={label} size={23}/></a> : null })}<a href={`mailto:${profile.email}`} aria-label="Email"><Icon name="Contact" size={23}/></a></div><div className="system-tray"><button className="tray-icons" aria-label="Open quick settings" aria-expanded={quickSettings} onClick={() => { setQuickSettings(!quickSettings); setStartOpen(false) }}><Icon name="Wifi" size={17}/><Icon name="Sound" size={17}/><Icon name="Battery" size={20}/></button><div><time>{timeLabel}</time><time>{dateLabel}</time></div></div></footer>
    </div>

  </>
}
export default App





