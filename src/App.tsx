import { useEffect, useRef, useState, type FormEvent } from 'react'
import './App.css'

const tabs = ['About', 'Projects', 'Resume', 'Experience', 'Skills', 'Extracurriculars', 'Contact'] as const
type Tab = typeof tabs[number]
type Profile = { name: string; email: string; location: string; intro: string; about: string; skills: string; projects: string; experience: string; extracurriculars: string; github: string; linkedin: string; photo: string; gallery: string[]; resume: string }
const initial: Profile = {
  name: 'Aiden Zhang', email: 'a522zhan@uwaterloo.ca', location: 'Richmond Hill, Ontario',
  intro: 'A little about me, what I’m working on, and the things I do along the way.',
  about: 'I’m Aiden, based in Richmond Hill, Ontario. This is my corner of the internet — a place to keep my projects, experiences, and a few things outside of work.',
  skills: '', projects: '', experience: '', extracurriculars: '', github: '', linkedin: '', photo: '', gallery: [], resume: '',
}
function readProfile(): Profile { try { return { ...initial, ...JSON.parse(localStorage.getItem('aiden-portfolio') || '{}') } } catch { return initial } }
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, string> = {
    About: 'M20 21v-2a7 7 0 0 0-14 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    Projects: 'M3 7V4h6l2 3h10v13H3V7Z',
    Resume: 'M6 3h8l4 4v14H6V3Zm8 0v5h4M9 12h6m-6 4h6',
    Experience: 'M3 7h18v14H3V7Zm5 0V3h8v4M3 12h18m-9-2v5',
    Skills: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',
    Extracurriculars: 'm12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3 3-6Z',
    Contact: 'M3 5h18v14H3V5Zm0 0 9 8 9-8',
    Settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
    Search: 'M16 16l5 5M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14',
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.Projects}/></svg>
}
function WindowsMark() { return <span className="windows-mark" aria-hidden="true"><i/><i/><i/><i/></span> }
function App() {
  const [profile, setProfile] = useState<Profile>(readProfile)
  const [tab, setTab] = useState<Tab>(() => tabs.find(t => t.toLowerCase() === window.location.hash.slice(1)) || 'About')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile)
  const [message, setMessage] = useState('')
  const [startOpen, setStartOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [now, setNow] = useState(new Date())
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 30000); return () => window.clearInterval(timer) }, [])
  const editorRef = useRef<HTMLDialogElement>(null)
  useEffect(() => { if (editing) editorRef.current?.showModal() }, [editing])
  function navigate(next: Tab) { setTab(next); setMinimized(false); setStartOpen(false); window.history.replaceState(null, '', `#${next.toLowerCase()}`); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function edit() { setDraft(profile); setMessage(''); setEditing(true) }
  function save(e: FormEvent) { e.preventDefault(); try { localStorage.setItem('aiden-portfolio', JSON.stringify(draft)); setProfile(draft); setEditing(false) } catch { setMessage('Your browser storage is full. Remove a photo and try again.') } }
  async function upload(files: FileList | null, gallery: boolean) {
    if (!files?.length) return
    try {
      const photos = await Promise.all(Array.from(files).slice(0, gallery ? 6 : 1).map(file => new Promise<string>((resolve, reject) => {
        if (!file.type.startsWith('image/')) { reject(new Error('Choose an image file.')); return }
        const reader = new FileReader()
        reader.onerror = () => reject(new Error('Could not read this photo.'))
        reader.onload = () => { const img = new Image(); img.onerror = () => reject(new Error('Choose a JPG, PNG, or WebP image.')); img.onload = () => { const canvas = document.createElement('canvas'); const scale = Math.min(1, 1200 / Math.max(img.width, img.height)); canvas.width = img.width * scale; canvas.height = img.height * scale; canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', .8)) }; img.src = String(reader.result) }
        reader.readAsDataURL(file)
      })))
      setDraft(d => gallery ? { ...d, gallery: [...d.gallery, ...photos].slice(0, 6) } : { ...d, photo: photos[0] }); setMessage('')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load this image.') }
  }
  const social = (label: string, url: string) => url ? <a className="social-link" href={url} target="_blank" rel="noreferrer">{label}<span>↗</span></a> : <span className="social-link unavailable">{label}<small>Not added yet</small></span>
  const entries = (value: string, label: string) => value.trim() ? <div className="file-list">{value.split('\n').filter(Boolean).map((line, i) => <article key={i}><span className="file-icon"><Icon name={tab}/></span><div><h3>{line}</h3><small>{label}</small></div></article>)}</div> : <div className="empty-state"><Icon name={tab} size={45}/><h2>No {label.toLowerCase()} added yet</h2><p>This folder is ready for the next part of my story.</p><button className="secondary" onClick={edit}>Add {label.toLowerCase()}</button></div>
  return <>
    <a href="#main" className="skip">Skip to content</a>
    <div className="desktop">
      <header className="desktop-header"><span><span className="red-square"/> {profile.name} <span className="header-separator">/</span> Personal workspace</span><span className="desktop-location">{profile.location}</span></header>
      <div className="desktop-shortcuts" aria-label="Desktop shortcuts">{(['About', 'Projects', 'Resume'] as const).map(item => <button onClick={() => navigate(item)} key={item}><span className={`desktop-icon icon-${item.toLowerCase()}`}><Icon name={item} size={30}/></span><span>{item === 'About' ? 'About me' : item}</span></button>)}</div>
      {!minimized ? <section className={`app-window ${maximized ? 'maximized' : ''}`} aria-label="Portfolio window">
        <header className="titlebar"><span className="window-title"><Icon name={tab} size={16}/>{tab === 'About' ? 'About me' : tab} <span className="title-divider">—</span><span className="title-owner">{profile.name}</span></span><div className="window-controls"><button aria-label="Minimize window" onClick={() => setMinimized(true)}>─</button><button aria-label={maximized ? 'Restore window' : 'Maximize window'} onClick={() => setMaximized(!maximized)}>{maximized ? '❐' : '□'}</button><button className="close-window" aria-label="Close window" onClick={() => setMinimized(true)}>×</button></div></header>
        <div className="toolbar"><div className="navigation-arrows"><button aria-label="Go to About me" onClick={() => navigate('About')}>←</button><button aria-label="Go up to About me" onClick={() => navigate('About')}>↑</button></div><div className="address-bar"><Icon name="Projects" size={16}/><span>Portfolio</span><span className="chevron">›</span><span>{tab === 'About' ? 'About me' : tab}</span></div><button className="toolbar-edit" onClick={edit}><Icon name="Settings" size={16}/><span>Edit profile</span></button></div>
        <div className="window-layout"><aside className="sidebar"><div className="sidebar-heading">MY PORTFOLIO</div><nav aria-label="Portfolio sections">{tabs.map(item => <button key={item} aria-current={tab === item ? 'page' : undefined} onClick={() => navigate(item)}><Icon name={item}/><span>{item === 'About' ? 'About me' : item}</span></button>)}</nav><div className="sidebar-bottom"><span className="small-avatar">{profile.name.split(' ').map(n => n[0]).join('')}</span><div><strong>{profile.name}</strong><small>Personal account</small></div></div></aside>
        <main id="main" className="window-content" key={tab}>
          {tab === 'About' ? <><div className="page-eyebrow"><span className="live-dot"/> WELCOME TO MY LITTLE CORNER OF THE INTERNET</div><div className="about-hero"><div><p className="hello-label">Hello there,</p><h1>I’m {profile.name.split(' ')[0]}<span>.</span></h1><p className="intro">{profile.intro}</p><div className="hero-actions"><button className="primary" onClick={() => navigate('Projects')}><Icon name="Projects" size={17}/>My projects<span>↗</span></button><button className="secondary" onClick={() => navigate('Resume')}><Icon name="Resume" size={17}/>View resume</button></div></div><div className="portrait-card">{profile.photo ? <img src={profile.photo} alt={`${profile.name}'s portrait`}/> : <button className="portrait-placeholder" onClick={edit}><Icon name="About" size={62}/><span>Add a photo</span><small>A face to the name</small></button>}<span className="portrait-label">{profile.name}<span className="live-dot"/></span></div></div>
            <section className="about-section"><h2><span className="section-icon"><Icon name="About" size={18}/></span>About me</h2><p>{profile.about}</p></section><div className="details-grid"><div className="detail-card"><span className="detail-label">BASED IN</span><strong>{profile.location}</strong><small>Canada</small></div><a className="detail-card" href={`mailto:${profile.email}`}><span className="detail-label">LET’S TALK <span>↗</span></span><strong>{profile.email}</strong><small>Drop me a message</small></a></div>
            <section className="explore-section"><div className="section-heading"><h2>Elsewhere in this workspace</h2><span>Open a folder to explore</span></div><div className="folder-grid">{(['Projects','Experience','Extracurriculars'] as const).map(item => <button key={item} onClick={() => navigate(item)}><Icon name={item} size={26}/><span>{item}<small>{item === 'Projects' ? 'Things I’m working on' : item === 'Experience' ? 'My journey so far' : 'Outside the everyday'}</small></span><span className="folder-arrow">↗</span></button>)}</div></section><div className="about-socials">{social('GitHub',profile.github)}{social('LinkedIn',profile.linkedin)}<a href={`mailto:${profile.email}`}>Email ↗</a></div>
          </> : <><div className="page-eyebrow">PORTFOLIO / {tab.toUpperCase()}</div><div className="page-heading"><span className="page-icon"><Icon name={tab} size={30}/></span><div><h1>{tab}</h1><p>{tab === 'Projects' ? 'A collection of things I’ve made and ideas I’m exploring.' : tab === 'Resume' ? 'My experience, all in one place.' : tab === 'Contact' ? 'Always happy to hear from you.' : tab === 'Skills' ? 'Tools and skills I’m building along the way.' : tab === 'Experience' ? 'Where I’ve been and what I’ve learned.' : 'A few things beyond work and study.'}</p></div></div>
            {tab === 'Projects' && entries(profile.projects,'Projects')}{tab === 'Skills' && entries(profile.skills,'Skills')}{tab === 'Experience' && entries(profile.experience,'Experience')}{tab === 'Extracurriculars' && <>{entries(profile.extracurriculars,'Activities')}<div className="gallery">{profile.gallery.map((photo,i) => <img key={i} src={photo} alt={`Personal photo ${i+1}`}/>)}</div></>}
            {tab === 'Resume' && <div className="resume-content">{profile.resume ? <><div className="resume-document"><Icon name="Resume" size={40}/><div><h2>{profile.name} — Resume</h2><p>PDF document</p></div><a className="primary" href={profile.resume} download={`${profile.name.replaceAll(' ','-')}-Resume.pdf`}>Download PDF ↓</a></div><object data={profile.resume} type="application/pdf" aria-label="Resume PDF" className="pdf-viewer"><p>Use Download PDF to view the resume.</p></object></> : <div className="empty-state"><Icon name="Resume" size={45}/><h2>Resume coming soon</h2><p>A place for my experience, education, and projects.</p><button className="secondary" onClick={edit}>Upload resume</button></div>}</div>}
            {tab === 'Contact' && <div className="contact-content"><a className="contact-email" href={`mailto:${profile.email}`}><Icon name="Contact" size={28}/>{profile.email}<span>↗</span></a><div className="about-socials">{social('GitHub',profile.github)}{social('LinkedIn',profile.linkedin)}</div><p className="contact-location">{profile.location}, Canada</p></div>}
          </>}
        </main></div><footer className="window-status"><span><span className="live-dot"/> {tab === 'About' ? 'A little about me' : tab}</span><span>Made personal. Still a work in progress.</span></footer>
      </section> : <div className="closed-workspace"><Icon name="About" size={48}/><h1>Your next click starts here.</h1><button className="primary" onClick={() => navigate('About')}>Open About me</button></div>}
      {startOpen && <section className="start-menu" aria-label="Start menu"><div className="start-top"><strong>Welcome, {profile.name.split(' ')[0]}</strong><button aria-label="Close Start menu" onClick={() => setStartOpen(false)}>×</button></div><p>Pinned</p><div className="start-apps">{tabs.map(item => <button key={item} onClick={() => navigate(item)}><Icon name={item} size={27}/>{item === 'About' ? 'About me' : item}</button>)}</div><button className="start-edit" onClick={() => { setStartOpen(false); edit() }}><Icon name="Settings"/>Edit profile & photos</button></section>}
      <footer className="taskbar"><div className="taskbar-brand"><span className="small-avatar">AZ</span><span>My workspace</span></div><div className="taskbar-apps"><button className={startOpen ? 'task-active' : ''} aria-label="Open Start menu" aria-expanded={startOpen} onClick={() => setStartOpen(!startOpen)}><WindowsMark/></button><span className="taskbar-divider"/>{(['About','Projects','Resume','Contact'] as const).map(item => <button className={!minimized && tab === item ? 'task-active' : ''} key={item} aria-label={`Open ${item}`} title={item} onClick={() => navigate(item)}><Icon name={item} size={23}/><span className="task-indicator"/></button>)}</div><div className="system-tray"><span className="tray-status" title="Personal portfolio">◇</span><div><time>{now.toLocaleTimeString('en-CA',{hour:'2-digit',minute:'2-digit',timeZone:'America/Toronto'})}</time><time>{now.toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric',timeZone:'America/Toronto'})}</time></div></div></footer>
    </div>
    {editing && <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setEditing(false) }}><dialog ref={editorRef} aria-labelledby="editor-title" onCancel={() => setEditing(false)}><form onSubmit={save}><div className="editor-heading"><h2 id="editor-title">Make yourself at home.</h2><button type="button" onClick={() => setEditing(false)} aria-label="Close editor">✕</button></div><p className="editor-note">Changes and photos are saved in this browser only. They won’t update the public website or sync to another device.</p><div className="form-grid">{(['name', 'email', 'location', 'github', 'linkedin'] as const).map(field => <label key={field}>{({ name: 'Name', email: 'Email', location: 'Location', github: 'GitHub URL', linkedin: 'LinkedIn URL' })[field]}<input type={field === 'email' ? 'email' : ['github', 'linkedin'].includes(field) ? 'url' : 'text'} value={draft[field]} onChange={e => setDraft({ ...draft, [field]: e.target.value })} required={['name', 'email'].includes(field)} placeholder={field === 'github' ? 'https://github.com/your-username' : field === 'linkedin' ? 'https://www.linkedin.com/in/your-profile' : ''}/></label>)}</div>{(['intro', 'about', 'skills', 'projects', 'experience', 'extracurriculars'] as const).map(field => <label key={field}>{field === 'intro' ? 'Short introduction' : field.charAt(0).toUpperCase() + field.slice(1)}{['skills', 'projects', 'experience', 'extracurriculars'].includes(field) && <small>One item per line. Add only what you want to share.</small>}<textarea rows={field === 'intro' ? 2 : 3} value={draft[field]} onChange={e => setDraft({ ...draft, [field]: e.target.value })}/></label>)}<label>Resume PDF<small>Saved in this browser. Maximum file size: 2 MB.</small><input type="file" accept="application/pdf" onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (file.type !== "application/pdf" || file.size > 2 * 1024 * 1024) { setMessage("Choose a PDF smaller than 2 MB."); return }; const reader = new FileReader(); reader.onerror = () => setMessage("Could not read the PDF."); reader.onload = () => { setDraft(d => ({ ...d, resume: String(reader.result) })); setMessage("") }; reader.readAsDataURL(file) }}/></label>{draft.resume && <button className="secondary" type="button" onClick={() => setDraft({ ...draft, resume: "" })}>Remove resume</button>}<label>Portrait photo<input type="file" accept="image/*" onChange={e => void upload(e.target.files, false)}/></label>{draft.photo && <div className="upload-preview"><img src={draft.photo} alt="Portrait preview"/><button type="button" onClick={() => setDraft({ ...draft, photo: '' })}>Remove portrait</button></div>}<label>Extracurricular photos <small>Up to 6 photos. Images are resized before saving.</small><input type="file" accept="image/*" multiple onChange={e => void upload(e.target.files, true)}/></label><div className="upload-gallery">{draft.gallery.map((photo, i) => <div key={i}><img src={photo} alt={`Photo ${i + 1} preview`}/><button type="button" onClick={() => setDraft({ ...draft, gallery: draft.gallery.filter((_, index) => index !== i) })}>Remove {i + 1}</button></div>)}</div>{message && <p role="alert">{message}</p>}<div className="editor-actions"><button type="button" onClick={() => setEditing(false)}>Cancel</button><button className="primary" type="submit">Save changes ↗</button></div></form></dialog></div>}
  </>
}
export default App




