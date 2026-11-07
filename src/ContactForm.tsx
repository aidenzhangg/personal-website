import { useState, type FormEvent } from 'react'

export function ContactForm({ email }: { email: string }) {
 const endpoint = import.meta.env.VITE_FORMSPREE_ENDPOINT?.trim() || 'https://formspree.io/f/moeezeqz'
 const [sending, setSending] = useState(false)
 const [name, setName] = useState('')
 const [reply, setReply] = useState('')
 const [message, setMessage] = useState('')
 const [status, setStatus] = useState('')
 const [error, setError] = useState('')
 const subject = name.trim() ? `Portfolio message from ${name.trim()}` : 'Portfolio message'
 const body = `${message.trim()}\n\nFrom: ${name.trim()}\nReply to: ${reply.trim()}`
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  if (sending) return
  if (!name.trim() || !reply.trim() || !message.trim()) {
   setError('Please fill in your name, email, and message.'); return
  }
  setError('')
  setStatus('')
  if (endpoint) {
   const form = event.currentTarget
   const data = new FormData(form)
   data.set('name', name.trim())
   data.set('email', reply.trim())
   data.set('message', message.trim())
   data.set('_subject', subject)
   if (data.get('_gotcha')) return
   setSending(true)
   const controller = new AbortController()
   const timer = window.setTimeout(() => controller.abort(), 15000)
   try {
    const response = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' }, signal: controller.signal })
    if (!response.ok) throw new Error('Submission failed')
    setStatus('Thank you! Your message was submitted.')
    setName(''); setReply(''); setMessage('')
   } catch {
    setError('We could not confirm your message was sent. Your draft is still here; try again or copy it and email me directly.')
   } finally {
    window.clearTimeout(timer)
    setSending(false)
   }
   return
  }
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
 return <form className="contact-message-form" onSubmit={submit} aria-busy={sending}>
  <h2>{endpoint ? 'Leave me a message' : 'Write me an email'}</h2>
  {!endpoint && <p className="contact-compose-note">This opens a draft in your email app. You review and send it there.</p>}
  <div className="message-fields">
   <label>Your name<input name="name" autoComplete="name" required readOnly={sending} maxLength={100} value={name} onChange={event => setName(event.target.value)}/></label>
   <label>Your email<input name="email" type="email" autoComplete="email" required readOnly={sending} maxLength={200} value={reply} onChange={event => setReply(event.target.value)}/></label>
  </div>
  <label>Message<textarea name="message" rows={6} required readOnly={sending} maxLength={5000} value={message} onChange={event => setMessage(event.target.value)}/></label>
  <div className="contact-honeypot" aria-hidden="true"><label>Leave empty<input name="_gotcha" tabIndex={-1} autoComplete="off"/></label></div>
  <div className="message-submit">
   <button className="primary" type="submit" disabled={sending}>{sending ? 'Sending...' : endpoint ? 'Send message' : 'Open email draft'}</button>
   <button className="secondary" type="button" onClick={copyDraft}>Copy email draft</button>
  </div>
  <p className="contact-compose-note">Prefer your own email service? Send to <a href={`mailto:${email}`}>{email}</a>.</p>
  {error && <p className="message-status message-error" role="alert">{error}</p>}
  {status && <p className="message-status" role="status">{status}</p>}
 </form>
}
