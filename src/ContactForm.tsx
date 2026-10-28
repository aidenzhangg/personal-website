import { useState, type FormEvent } from 'react'
export function ContactForm({ email }: { email: string }) {
 const [status, setStatus] = useState('')
 function submit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  const data = new FormData(event.currentTarget)
  const name = String(data.get('name') || '').trim()
  const reply = String(data.get('email') || '').trim()
  const message = String(data.get('message') || '').trim()
  if (!name || !reply || !message) { setStatus('Please fill in your name, email, and message.'); return }
  const subject = encodeURIComponent(`Portfolio message from ${name}`)
  const body = encodeURIComponent(`${message}\n\nFrom: ${name}\nReply to: ${reply}`)
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  setStatus('Your email app should open with your message. Send it there to finish.')
 }
 return <form className="contact-message-form" onSubmit={submit}><h2>Leave me a message</h2><div className="message-fields"><label>Your name<input name="name" autoComplete="name" required maxLength={100}/></label><label>Your email<input name="email" type="email" autoComplete="email" required maxLength={200}/></label></div><label>Message<textarea name="message" rows={6} required maxLength={5000}/></label><div className="message-submit"><button className="primary" type="submit">Open email draft </button><p>Opens your email app. Your message is sent when you send the draft.</p></div>{status && <p className="message-status" role="status">{status}</p>}</form>
}
