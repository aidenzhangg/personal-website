import { useRef, useState, type FormEvent } from 'react'

export function ContactForm({ email }: { email: string }) {
 const [status, setStatus] = useState('')
 const [sending, setSending] = useState(false)
 const [failed, setFailed] = useState(false)
 const inFlight = useRef(false)
 async function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  if (inFlight.current) return
  const form = event.currentTarget
  const data = new FormData(form)
  if (data.get('_honey')) return
  const name = String(data.get('name') || '').trim()
  const reply = String(data.get('email') || '').trim()
  const message = String(data.get('message') || '').trim()
  if (!name || !reply || !message) { setFailed(true); setStatus('Please fill in your name, email, and message.'); return }
  inFlight.current = true; setSending(true); setFailed(false); setStatus('')
  try {
   const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ name, email: reply, message, _subject: `Portfolio message from ${name}`, _replyto: reply, _template: 'table' }),
    signal: AbortSignal.timeout(20000),
   })
   const result: { success?: boolean | string; message?: string } = await response.json()
   if (!response.ok || !(result.success === true || result.success === 'true')) throw new Error('Submission failed')
   if (result.message && /activat|confirm.*email/i.test(result.message)) {
    setStatus('The form is awaiting inbox confirmation. Please contact Aiden using the email address above until activation is complete.')
   } else {
    setStatus('Message submitted. Thank you for getting in touch.')
    form.reset()
   }
  } catch {
   setFailed(true); setStatus('Could not submit your message. Please try again or contact me at the email address above. Your message is still here.')
  } finally { inFlight.current = false; setSending(false) }
 }
 return <form className="contact-message-form" onSubmit={submit} aria-busy={sending}><h2>Leave me a message</h2><div className="message-fields"><label>Your name<input name="name" autoComplete="name" required maxLength={100} disabled={sending}/></label><label>Your email<input name="email" type="email" autoComplete="email" required maxLength={200} disabled={sending}/></label></div><label>Message<textarea name="message" rows={6} required maxLength={5000} disabled={sending}/></label><div className="contact-honeypot" aria-hidden="true"><label>Leave this field empty<input name="_honey" type="text" tabIndex={-1} autoComplete="off"/></label></div><div className="message-submit"><button className="primary" type="submit" disabled={sending}>{sending ? 'Sending...' : 'Send message'}</button><p>Sends to my email.</p></div>{status && <p className={`message-status ${failed ? 'message-error' : ''}`} role={failed ? 'alert' : 'status'}>{status}</p>}</form>
}
