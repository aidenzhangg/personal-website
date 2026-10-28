import { useEffect, useRef, useState, type FormEvent } from 'react'
import './App.css'

const tabs = ['Home', 'Skills', 'Projects', 'Experience', 'Extracurriculars', 'About', 'Contact'] as const
type Tab = typeof tabs[number]
type Profile = { name: string; email: string; location: string; intro: string; about: string; skills: string; projects: string; experience: string; extracurriculars: string; github: string; linkedin: string; photo: string; gallery: string[] }
const initial: Profile = {
  name: 'Aiden Zhang', email: 'a522zhan@uwaterloo.ca', location: 'Richmond Hill, Ontario',
  intro: 'A little about me, what I’m working on, and the things I do along the way.',
  about: 'I’m Aiden, based in Richmond Hill, Ontario. This is my corner of the internet — a place to keep my projects, experiences, and a few things outside of work.',
  skills: '', projects: '', experience: '', extracurriculars: '', github: '', linkedin: '', photo: '', gallery: [],
}
function readProfile(): Profile { try { return { ...initial, ...JSON.parse(localStorage.getItem('aiden-portfolio') || '{}') } } catch { return initial } }
function App() {
  const [profile, setProfile] = useState<Profile>(readProfile)
  const [tab, setTab] = useState<Tab>(() => tabs.find(t => t.toLowerCase() === window.location.hash.slice(1)) || 'Home')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile)
  const [message, setMessage] = useState('')
  const editorRef = useRef<HTMLDialogElement>(null)
  useEffect(() => { if (editing) editorRef.current?.showModal() }, [editing])
  function navigate(next: Tab) { setTab(next); window.history.replaceState(null, '', `#${next.toLowerCase()}`); window.scrollTo({ top: 0, behavior: 'smooth' }) }
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
  const social = (label: string, url: string) => url ? <a href={url} target="_blank" rel="noreferrer">{label} <span>↗</span></a> : <span className="pending">{label} <small>coming soon</small></span>
  const entries = (value: string, empty: string) => value.trim() ? <div className="entries">{value.split('\n').filter(Boolean).map((line, i) => <article key={i}><span className="entry-mark">↗</span><p>{line}</p></article>)}</div> : <div className="empty-state"><span className="small-label">A WORK IN PROGRESS</span><h3>{empty}</h3><p>I’ll be adding more here soon. In the meantime, feel free to say hello.</p><a href={`mailto:${profile.email}`}>Get in touch ↗</a></div>
  return <>
    <a href="#main" className="skip">Skip to content</a>
    <div className="site-shell">
      <header><button className="wordmark" onClick={() => navigate('Home')} aria-label="Home">{profile.name}<span className="wordmark-dot">.</span></button><div className="header-note"><span className="status-dot" /> A personal collection</div></header>
      <nav aria-label="Main navigation">{tabs.map(t => <button key={t} aria-current={tab === t ? 'page' : undefined} onClick={() => navigate(t)}>{t}</button>)}</nav>
      <main id="main" key={tab}>
        {tab === 'Home' ? <>
          <section className="hero"><div className="hero-copy"><p className="eyebrow">HELLO, I’M {profile.name.split(' ')[0].toUpperCase()}</p><h1>A few things<br />about <em>me.</em></h1><p className="intro">{profile.intro}</p><button className="primary" onClick={() => navigate('Projects')}>Explore my projects <span>↗</span></button><p className="location"><svg width="16" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>{profile.location}</p></div>
          <div className="photo-composition"><div className="photo-frame">{profile.photo ? <img src={profile.photo} alt={`${profile.name}, personal portrait`} /> : <div className="portrait-placeholder"><span className="sun"/><div className="landscape-back"/><div className="landscape-front"/><span className="photo-placeholder-label">A PHOTO GOES HERE</span></div>}<div className="photo-caption"><span>{profile.photo ? 'A little glimpse of my world.' : 'Room for a favourite photo.'}</span><span>↗</span></div></div><span className="handwritten">a face to the name</span><svg className="scribble" viewBox="0 0 110 65" fill="none" aria-hidden="true"><path d="M7 48C50 70 96 46 85 9M73 18 85 8l10 12" stroke="currentColor" strokeWidth="1.5"/></svg></div></section>
          <section className="explore"><div className="section-top"><h2>Take a look around</h2><span>There’s a bit of everything here.</span></div><div className="explore-grid">{[{ title: 'Projects' as Tab, text: 'Things I’ve made and ideas I’m exploring.', icon: '↗' }, { title: 'Experience' as Tab, text: 'Where I’ve been and what I’ve learned.', icon: '⌁' }, { title: 'Beyond the desk', target: 'Extracurriculars' as Tab, text: 'The interests and activities in between.', icon: '✳' }].map(item => <button key={item.title} onClick={() => navigate(item.target || item.title as Tab)}><span className="tile-icon">{item.icon}</span><h3>{item.title}</h3><p>{item.text}</p><span className="tile-arrow">↗</span></button>)}</div></section>
          <section className="hello-strip"><p>Good conversations start with a hello.</p><a href={`mailto:${profile.email}`}>Let’s connect <span>↗</span></a></section>
        </> : <section className="inner-page"><p className="eyebrow">{profile.name.toUpperCase()} / {tab.toUpperCase()}</p><h1>{tab === 'Extracurriculars' ? <>Beyond the <em>desk.</em></> : tab === 'About' ? <>A little <em>more.</em></> : tab === 'Contact' ? <>Say <em>hello.</em></> : <>{tab}<span className="accent">.</span></>}</h1>
          {tab === 'About' && <div className="about-layout"><div><p className="large-copy">{profile.about}</p><p className="location">Based in {profile.location}.</p></div>{profile.photo && <img className="about-photo" src={profile.photo} alt={profile.name}/>}</div>}
          {tab === 'Skills' && entries(profile.skills, 'Always something new to learn.')}
          {tab === 'Projects' && entries(profile.projects, 'Making space for what’s next.')}
          {tab === 'Experience' && entries(profile.experience, 'The story is still being written.')}
          {tab === 'Extracurriculars' && <>{entries(profile.extracurriculars, 'There’s more to life than a screen.')}{profile.gallery.length > 0 && <div className="gallery">{profile.gallery.map((photo, i) => <img key={i} src={photo} alt={`A personal moment from ${profile.name}'s photo collection, ${i + 1}`} />)}</div>}</>}
          {tab === 'Contact' && <div className="contact-layout"><p className="large-copy">Have a question, an idea, or just want to chat? My inbox is open.</p><a className="email-link" href={`mailto:${profile.email}`}>{profile.email} ↗</a><div className="social-links">{social('LinkedIn', profile.linkedin)}{social('GitHub', profile.github)}</div><p className="location">{profile.location}</p></div>}
        </section>}
      </main>
      <footer><span>© {new Date().getFullYear()} {profile.name}</span><div>{social('LinkedIn', profile.linkedin)}{social('GitHub', profile.github)}<a href={`mailto:${profile.email}`}>Email ↗</a></div><button className="edit-link" onClick={edit}>Edit this site ↗</button></footer>
    </div>
    {editing && <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setEditing(false) }}><dialog ref={editorRef} aria-labelledby="editor-title" onCancel={() => setEditing(false)}><form onSubmit={save}><div className="editor-heading"><h2 id="editor-title">Make yourself at home.</h2><button type="button" onClick={() => setEditing(false)} aria-label="Close editor">✕</button></div><p className="editor-note">Changes and photos are saved in this browser only. They won’t update the public website or sync to another device.</p><div className="form-grid">{(['name', 'email', 'location', 'github', 'linkedin'] as const).map(field => <label key={field}>{({ name: 'Name', email: 'Email', location: 'Location', github: 'GitHub URL', linkedin: 'LinkedIn URL' })[field]}<input type={field === 'email' ? 'email' : ['github', 'linkedin'].includes(field) ? 'url' : 'text'} value={draft[field]} onChange={e => setDraft({ ...draft, [field]: e.target.value })} required={['name', 'email'].includes(field)} placeholder={field === 'github' ? 'https://github.com/your-username' : field === 'linkedin' ? 'https://www.linkedin.com/in/your-profile' : ''}/></label>)}</div>{(['intro', 'about', 'skills', 'projects', 'experience', 'extracurriculars'] as const).map(field => <label key={field}>{field === 'intro' ? 'Home introduction' : field.charAt(0).toUpperCase() + field.slice(1)}{['skills', 'projects', 'experience', 'extracurriculars'].includes(field) && <small>One item per line. Add only what you want to share.</small>}<textarea rows={field === 'intro' ? 2 : 3} value={draft[field]} onChange={e => setDraft({ ...draft, [field]: e.target.value })}/></label>)}<label>Portrait photo<input type="file" accept="image/*" onChange={e => void upload(e.target.files, false)}/></label>{draft.photo && <div className="upload-preview"><img src={draft.photo} alt="Portrait preview"/><button type="button" onClick={() => setDraft({ ...draft, photo: '' })}>Remove portrait</button></div>}<label>Extracurricular photos <small>Up to 6 photos. Images are resized before saving.</small><input type="file" accept="image/*" multiple onChange={e => void upload(e.target.files, true)}/></label><div className="upload-gallery">{draft.gallery.map((photo, i) => <div key={i}><img src={photo} alt={`Photo ${i + 1} preview`}/><button type="button" onClick={() => setDraft({ ...draft, gallery: draft.gallery.filter((_, index) => index !== i) })}>Remove {i + 1}</button></div>)}</div>{message && <p role="alert">{message}</p>}<div className="editor-actions"><button type="button" onClick={() => setEditing(false)}>Cancel</button><button className="primary" type="submit">Save changes ↗</button></div></form></dialog></div>}
  </>
}
export default App


