import { useState, type FormEvent } from 'react'

export function ContactForm({ email }: { email: string }) {
 const [name, setName] = useState('')
 const [reply, setReply] = useState('')
 const [message, setMessage] = useState('')
 const [status, setStatus] = useState('')
 const [error, setError] = useState('')
 const subject = name.trim() ? `Portfolio message from ${name.trim()}` : 'Portfolio message'
 const body = `${message.trim()}\n\nFrom: ${name.trim()}\nReply to: ${reply.trim()}`
 function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  if (!name.trim() || !reply.trim() || !message.trim()) {
   setError('Please fill in your name, email, and message.'); return
  }
  setError('')
  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  setStatus('Finish sending in your email app. If it did not open, copy your draft below and paste it into your email service.')
 }
 async function copyDraft() {
  try {
   await navigator.clipboard.writeText(`To: ${email}\nSubject: ${subject}\n\n${body}`)
   setError(''); setStatus('Draft copied. Paste it into your email service and send it there.')
  } catch {
   setStatus(''); setError('Copy is unavailable in this browser. Select and copy your message above, then email it to ' + email + '.')
  }
 }
 return <form className="contact-message-form" onSubmit={submit}>
  <h2>Write me an email</h2>
  <p className="contact-compose-note">This opens a draft in your email app. You review and send it there.</p>
  <div className="message-fields">
   <label>Your name<input name="name" autoComplete="name" required maxLength={100} value={name} onChange={event => setName(event.target.value)}/></label>
   <label>Your email<input name="email" type="email" autoComplete="email" required maxLength={200} value={reply} onChange={event => setReply(event.target.value)}/></label>
  </div>
  <label>Message<textarea name="message" rows={6} required maxLength={5000} value={message} onChange={event => setMessage(event.target.value)}/></label>
  <div className="message-submit">
   <button className="primary" type="submit">Open email draft</button>
   <button className="secondary" type="button" onClick={copyDraft}>Copy email draft</button>
  </div>
  <p className="contact-compose-note">Prefer your own email service? Send to <a href={`mailto:${email}`}>{email}</a>.</p>
  {error && <p className="message-status message-error" role="alert">{error}</p>}
  {status && <p className="message-status" role="status">{status}</p>}
 </form>
}
