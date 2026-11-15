export function RecallReport() {
  return <section className="telemetry-report" aria-label="Recall project report">
    <section className="telemetry-validation"><h2>Why I built this</h2>
      <p>Getting an AI answer immediately can feel like understanding without testing what I actually remember. Recall puts practice beside the material in a Chrome side panel: import notes, try a question, ask for a hint, and review the topics that need more work.</p>
    </section>
    <section className="telemetry-validation"><h2>From course material to practice</h2>
      <p>Students can paste notes or import text, Markdown, and selectable-text PDFs. The extension extracts PDF text in the browser with pdf.js, then supports multiple-choice, fill-in-the-blank, long-answer, and mixed practice, alongside flashcards and past-paper review.</p>
      <p>Questions are marked as they are answered, with a session review showing answers and explanations. Only first attempts count toward the score. A rule-based scheduler prioritizes missed passages and schedules later reviews after correct answers.</p>
    </section>
    <section className="telemetry-validation"><h2>AI help that leaves room to think</h2>
      <p>Recall AI answers questions using relevant passages from the imported notes and shows the note lines used. During quiz practice, a three-step hint flow explains the concept and narrows the next step, with checks that reject responses revealing the hidden answer.</p>
      <p>The AI integration wraps an OpenAI-compatible chat-completions API for explanations, progressive hints, quiz generation, flashcards, and practice papers. In the Supabase setup, an authenticated Edge Function calls Groq with a server-held key; the current configured default is <code>openai/gpt-oss-120b</code>. The provider layer also supports OpenAI models, with the model selected through configuration.</p>
    </section>
    <section className="telemetry-validation"><h2>Face detection and focus tracking</h2>
      <p>The camera feature detects a face using MediaPipe Face Landmarker and draws its outline in the live preview. Head direction and eye-closure signals classify looking at the screen, looking away, closed eyes, or no face detected. A focus timer works alongside these checks and Chrome's site-blocking rules.</p>
      <p>After the configured time away, the timer pauses and chimes; looking back can resume it. The interface shows estimated screen attention, look-away events, and the longest uninterrupted streak. Frames are processed in memory, and face detection does not identify who the person is or measure their understanding.</p>
    </section>
    <section className="telemetry-validation"><h2>Architecture and account storage</h2>
      <p>The application connects a React and TypeScript Chrome extension to Supabase for authentication, PostgreSQL study-data storage, and the AI gateway. Account storage keeps notes, quizzes, flashcards, and progress available between sessions, while row-level security separates users' saved data.</p>
      <p>The Java 21 and Spring Boot backend handles additional account, AI, and phone-pairing routes, with JDBC, HikariCP, and PostgreSQL support. Recall Connect pairs a phone through a QR code so a photo can be uploaded, reviewed, and manually imported as notes. Automatic text recognition for phone photos and scanned PDFs is not implemented.</p>
    </section>
    <section className="telemetry-validation"><h2>Engineering and current scope</h2>
      <p>The repository includes Node tests for extension logic, JUnit tests for the backend, and GitHub Actions checks. The work brings together asynchronous UI state, PDF extraction, review scheduling, browser permissions, account isolation, and bounded file uploads.</p>
      <p>The project combines pretrained language models with MediaPipe face detection and custom application logic for hints, review scheduling, and focus tracking. The camera percentage estimates screen attention; generated questions and AI feedback still need checking against the original course material.</p>
    </section>
  </section>
}
