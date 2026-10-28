import { useEffect, useState, type FormEvent } from 'react'

export function ContactForm({ email }: { email: string }) {
 const [sending, setSending] = useState(false)
 const [error, setError] = useState('')
 const [submitted] = useState(() => new URLSearchParams(window.location.search).get('message') === 'submitted')
 const returnUrl = new URL(window.location.href)
 returnUrl.searchParams.set('message', 'submitted')
 returnUrl.hash = 'contact'
 useEffect(() => {
  const reset = () => setSending(false)
  window.addEventListener('pageshow', reset)
  return () => window.removeEventListener('pageshow', reset)
 }, [])
 function submit(event: FormEvent<HTMLFormElement>) {
  const data = new FormData(event.currentTarget)
  if (data.get('_honey')) { event.preventDefault(); return }
  const name = String(data.get('name') || '').trim()
  const reply = String(data.get('email') || '').trim()
  const message = String(data.get('message') || '').trim()
  if (!name || !reply || !message) {
   event.preventDefault(); setError('Please fill in your name, email, and message'); return
  }
  setError(''); setSending(true)
  // Allow a regular browser POST so the provider can display CAPTCHA,
  // activation, or delivery errors instead of masking them as a CORS failure.
 }
 return <form className="contact-message-form" action={`https://formsubmit.co/${email}`} method="POST" onSubmit={submit} aria-busy={sending}><h2>Leave me a message</h2><input type="hidden" name="_subject" value="New portfolio message"/><input type="hidden" name="_template" value="table"/><input type="hidden" name="_next" value={returnUrl.toString()}/><input type="hidden" name="_url" value={window.location.href}/><div className="message-fields"><label>Your name<input name="name" autoComplete="name" required maxLength={100}/></label><label>Your email<input name="email" type="email" autoComplete="email" required maxLength={200}/></label></div><label>Message<textarea name="message" rows={6} required maxLength={5000}/></label><div className="contact-honeypot" aria-hidden="true"><label>Leave this field empty<input name="_honey" type="text" tabIndex={-1} autoComplete="off"/></label></div><div className="message-submit"><button className="primary" type="submit" disabled={sending}>{sending ? 'Submitting...' : 'Send message'}</button></div>{error && <p className="message-status message-error" role="alert">{error}</p>}{submitted && !error && <p className="message-status" role="status">Your message was submitted</p>}</form>
}
