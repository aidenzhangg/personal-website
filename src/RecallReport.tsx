import { FocusDemo } from './FocusDemo'
import './RecallReport.css'

const shots = [
  { file: '01-welcome.png', title: 'Opening screen', caption: 'Sign in with Google or email, or continue as a guest. Study data is saved to the account, never to the device' },
  { file: '03-notes.png', title: 'Notes', caption: 'Paste notes or import a PDF, TXT or Markdown file. PDFs are read in the browser with pdf.js' },
  { file: '04-practice-question.png', title: 'Practice', caption: 'Questions are written from the notes and marked as soon as you answer. Only first tries count' },
  { file: '05-flashcards.png', title: 'Flashcards', caption: 'Flip a card, then mark it Got it or Still learning. Missed cards come back in their own round' },
  { file: '02-recall-ai.png', title: 'Recall AI chat', caption: 'Answers show the note lines they used, plus search links to keep researching. Shown in guest mode, where it searches the notes without the AI' },
  { file: '06-focus-running.png', title: 'Focus timer', caption: 'Starting a session locks the site blocker on until it ends. Camera focus can pause the timer when you look away' },
  { file: '07-block-sites.png', title: 'Website blocking', caption: 'Block a domain and its subdomains. During a focus session, sites can be added but not removed' },
]

const features = [
  ['Notes and PDFs', 'Paste notes or import TXT, Markdown and PDF files, including past papers. PDFs are read in reading order, with a warning for pages that have no selectable text.'],
  ['Recall AI chat', 'Ask about your notes and paste screenshots straight into the chat with Ctrl+V. Answers show the note lines they used.'],
  ['Hints, not answers', 'On a quiz question the AI gives three hints that get closer each time. A reply that would give away the answer is thrown out, and there is no setting to turn this off.'],
  ['Quizzes and flashcards', 'Multiple choice, fill in the blank, long answer or mixed, written from the meaning of your notes, plus flashcards with a missed-card round.'],
  ['Review scheduling', 'Missed passages come back first, and a later review is scheduled after a correct answer. This is rule-based, not a trained model.'],
  ['Practice papers and problem sets', 'Upload a past paper and get a new one in the same format, or pick a topic and get worked problems, both downloadable as PDFs.'],
  ['Focus timer and camera focus', 'A 15 to 60 minute timer. The optional webcam check pauses it when you look away and resumes it when you look back.'],
  ['Website blocking', 'Uses Chrome\'s declarativeNetRequest rules, so no browsing history is recorded. Blocking locks on for the length of a focus session.'],
  ['Accounts and guest mode', 'Google or email sign-in through Supabase. Guests can use everything except Recall AI, and nothing is saved.'],
  ['Recall Connect', 'Pair a phone with a QR code and send a photo of handwritten notes to the desktop to review and import.'],
]

const stack = [
  ['Extension', 'React 19, TypeScript, Vite, Chrome Manifest V3 (side panel, storage, declarativeNetRequest, identity)'],
  ['AI', 'A Supabase Edge Function (Deno) calling Groq: gpt-oss-120b for text and a vision model for screenshots, with Chrome\'s on-device Gemini Nano and rule-based code as fallbacks'],
  ['Accounts and data', 'Supabase Auth (email and Google), PostgreSQL with row-level security'],
  ['Google sign-in', 'An OAuth 2.0 client on Google Cloud Platform, connected to Supabase and Chrome\'s identity API'],
  ['Computer vision', 'MediaPipe Face Landmarker running as WebAssembly in the browser'],
  ['Files', 'pdf.js to read PDFs and jsPDF to write them, both in the browser'],
  ['Backend', 'Java 21, Spring Boot, JDBC with HikariCP, PDFBox, Maven, PostgreSQL'],
  ['Testing and CI', '61 Node tests and 36 JUnit tests, ESLint and GitHub Actions on every push'],
]

const security = [
  ['Parameterized SQL', 'Every query in the Java backend goes through JDBC with ? placeholders, so user input is always sent as data and never pasted into SQL text. This blocks SQL injection.'],
  ['Row-level security', 'Each PostgreSQL table checks auth.uid() = user_id on every select, insert, update and delete. Even with a valid key, one user cannot read or change another user\'s notes.'],
  ['No API key in the extension', 'The Groq key lives only as a Supabase secret. The extension calls an Edge Function, which checks the user\'s sign-in token and turns away guests. The production build refuses to include an AI key.'],
  ['Rate limits and size limits', 'Each account gets a daily AI limit, counted by a SECURITY DEFINER function with a pinned search_path and a hard cap of 1000, so calling it directly cannot raise the limit. Oversized requests and pictures are refused with 413.'],
  ['Input checks', 'Images must be well-formed JPEG, PNG or WebP data URLs and are only accepted in user messages, at most three per request. Saved progress is capped at 8 MB per account.'],
  ['Password storage', 'The backend hashes passwords with PBKDF2-HMAC-SHA256 (210,000 iterations) and a random per-user salt, and compares them in constant time. It locks sign-in for five minutes after eight failed attempts.'],
  ['Sessions and pairing codes', 'Session tokens and phone-pairing codes are stored only as SHA-256 hashes. Pairing codes expire after five minutes and can be used once.'],
  ['Security headers', 'The backend sends a strict Content-Security-Policy, X-Frame-Options DENY, nosniff, no-referrer and no-store. The extension only runs its own scripts.'],
  ['Privacy', 'Camera frames are processed in memory and never stored or sent. The site blocker uses Chrome\'s blocking rules and does not record browsing history.'],
]

export function RecallReport() {
  return <section className="telemetry-report" aria-label="Recall project report">
    <section className="project-photo-section project-media-section" aria-label="Recall screenshots"><h2>Screens</h2>
      <div className="recall-shot-grid">{shots.map(shot => <figure key={shot.file}><a href={`/projects/recall/${shot.file}`} target="_blank" rel="noreferrer" aria-label={`Open ${shot.title.toLowerCase()} screenshot`}><img src={`/projects/recall/${shot.file}`} alt={`Recall ${shot.title}: ${shot.caption}`} width="840" height="1680" loading="lazy"/></a><figcaption><strong>{shot.title}</strong>{shot.caption}</figcaption></figure>)}</div>
      <figure className="project-media-figure"><a href="/projects/recall/08-blocked-page.png" target="_blank" rel="noreferrer" aria-label="Open blocked page screenshot"><img src="/projects/recall/08-blocked-page.png" alt="The browser refusing to open youtube.com because it was blocked by the Recall extension" loading="lazy"/></a><figcaption>With blocking on, opening youtube.com is stopped by the browser before the page loads</figcaption></figure>
    </section>

    <section className="telemetry-validation"><h2>Why I built this</h2>
      <p>While studying, I noticed how easy it is to ask ChatGPT, Claude or Gemini for an answer, read an explanation that makes sense, and move on without checking whether I could solve the problem myself. Having the answer in front of me hid the parts I still did not understand. I wanted a study helper that keeps me doing the thinking.</p>
      <p>Recall puts my course material, practice questions and guidance in one Chrome side panel. When I get stuck, it gives me hints so I can take the next step myself. It also points me to Wikipedia, Khan Academy, YouTube and MIT OpenCourseWare searches, so asking for help leads to more research instead of a copied answer.</p>
    </section>

    <section className="telemetry-validation"><h2>Features</h2><dl className="recall-features">{features.map(([name, text]) => <div key={name}><dt>{name}</dt><dd>{text}</dd></div>)}</dl></section>

    <section className="project-photo-section project-media-section" aria-label="Camera focus demo"><h2>Interactive camera focus demo</h2>
      <figure className="project-media-figure"><FocusDemo/><figcaption>A browser simulation of Recall's camera focus check, using a drawn face rather than a real one. In the extension, MediaPipe Face Landmarker finds 478 face landmarks and eye-blink scores in each webcam frame. Recall reduces them to head turn (yaw), head tilt (pitch) and blink, and the sliders here stand in for those values. The classification uses the same thresholds as the extension. Press Play scenario to watch a short session, or drag the sliders yourself</figcaption></figure>
      <ul className="telemetry-task-list">
        <li><strong>Four states:</strong> looking at the screen, looking away (head turned or tilted past a threshold), eyes closed (blink score above 0.6) and no face.</li>
        <li><strong>Calibration:</strong> the first few seconds of a forward-facing face set a personal baseline, so a webcam off to one side still works. After that, the baseline only learns from frames already on screen, so looking away never teaches it.</li>
        <li><strong>Timer rules:</strong> being away for more than two seconds counts as a look-away. At the chosen timeout (15 seconds to 2 minutes) it chimes and pauses. Two seconds back on screen resumes it, and paused time is not scored.</li>
        <li><strong>Stats:</strong> screen attention (time on screen divided by time tracked), look-away count, best unbroken streak and a strip of the last minute.</li>
        <li><strong>Limits:</strong> it estimates where you are looking, not whether you understand. It does not identify who you are, and the rules are hand-written thresholds, not a trained model.</li>
      </ul>
    </section>

    <section className="telemetry-validation"><h2>Tech stack</h2><dl className="recall-features recall-stack">{stack.map(([name, text]) => <div key={name}><dt>{name}</dt><dd>{text}</dd></div>)}</dl></section>

    <section className="telemetry-validation"><h2>Security</h2>
      <p>Recall stores people's notes and calls a paid AI API, so I treated every request as untrusted and checked it on the server, not only in the extension.</p>
      <ul className="telemetry-task-list">{security.map(([name, text]) => <li key={name}><strong>{name}:</strong> {text}</li>)}</ul>
    </section>

    <section className="telemetry-validation"><h2>How a Recall AI request works</h2><ol className="telemetry-flow">
      <li><span>The extension sends the question, the relevant note passages and any pasted screenshot, shrunk to a small JPEG in the browser, along with the user's Supabase sign-in token.</span></li>
      <li><span>The Edge Function checks the token with Supabase Auth and turns away guests and signed-out users.</span></li>
      <li><span>It records the request against the user's daily limit in PostgreSQL and refuses anything over the limit or too large.</span></li>
      <li><span>It forwards the request to Groq with the server-side key, choosing the vision model when there is a picture.</span></li>
      <li><span>In a quiz, the extension checks the reply and throws it away if it would reveal the answer, then shows the hint along with the note lines it used.</span></li>
    </ol></section>

    <section className="telemetry-validation"><h2>What I learned</h2>
      <p>This was my first project where I owned everything from the UI to the database. I learned to design PostgreSQL tables around row-level security, keep secrets on the server, and set up OAuth on Google Cloud. I also learned to work within Chrome's extension permissions and run computer vision in the browser. I wrote the core logic as pure functions (gaze classification, hint redaction, review scheduling and PDF parsing) so it could be tested without a browser, and GitHub Actions runs the tests, lint and build on every push.</p>
      <p>Nothing here was trained by me. The language models and Face Landmarker are pretrained, and Recall never uses notes or camera frames to train anything. Generated questions and AI feedback still need checking against the original course material.</p>
    </section>
  </section>
}
