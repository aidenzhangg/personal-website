import './ImuWristbandReport.css'

const base = '/projects/imu-wristband'

const glance = [
  { name: 'Sensors', role: 'MMA7361 3-axis accelerometer (analog, ±1.5 g) and MAX30102 pulse sensor (I2C)' },
  { name: 'Board', role: 'Arduino UNO R4 Minima, 200-line sketch' },
  { name: 'Stream rate', role: '20 Hz JSON over USB serial at 115200 baud; up to ~25 Hz polling over Wi-Fi' },
  { name: 'Heart rate', role: '400 samples/s, averaged 4× in hardware to 100 Hz; 4-beat rolling average' },
  { name: 'Program', role: '16 exercises in 8 categories, 12-session program block' },
  { name: 'Rep rule', role: 'Counts at ≥85% of the calibrated range, resets within 15% of the start' },
  { name: 'Web app', role: 'React 19 + TypeScript + Vite, ~2,000 lines, no backend' },
  { name: 'Tests', role: '26 unit tests + 14 Playwright end-to-end tests run on desktop and mobile (28 runs)' },
]

const wiring = [
  { name: 'MMA7361 X / Y / Z', role: 'A0 / A1 / A2' },
  { name: 'MMA7361 VCC, SL', role: '3.3 V (sleep pin held high)' },
  { name: 'GY-MAX30102 SDA / SCL', role: 'SDA / SCL header' },
  { name: 'GY-MAX30102 VIN / GND', role: '3.3 V / GND' },
]

function Photo({ file, alt, caption, width, height }: { file: string; alt: string; caption: string; width?: number; height?: number }) {
  return <figure className="project-media-figure"><a href={`${base}/${file}`} target="_blank" rel="noreferrer" aria-label={`Open image: ${caption}`}><img src={`${base}/${file}`} alt={alt} width={width} height={height} loading="lazy"/></a><figcaption>{caption}</figcaption></figure>
}

export function ImuWristbandReport() {
  return <section className="telemetry-report" aria-label="IMU exercise wristband project report">
    <p className="telemetry-summary">A wearable motion-and-vitals band, plus a web app that coaches a full exercise session around it. An Arduino UNO R4 Minima reads a 3-axis accelerometer and a pulse sensor on the arm or thigh, streams joint angle and heart rate to the browser at 20 Hz, and the site counts reps, flags short reps, keeps you in your heart-rate zone and logs every set.</p>
    <p className="telemetry-summary">The firmware turns the three accelerometer axes into pitch and roll to 0.1°, and only reports a heart rate after 4 good beats in a row, so the app never shows a made-up number. The app calibrates each user's start and end angles, counts a rep at 85% of that range, flags short reps with the percentage reached, and times holds like planks only while you stay within ±12° of position. During cardio it keeps you inside a 114–136 BPM heart-rate-reserve zone, and once you hit 20 reps on both sets it tells you to add load.</p>
    <p className="telemetry-summary">The session follows the <strong>CCCARE</strong> exercise program from the University of Waterloo: a warm-up and 15–30 min of cardio at 40–60% of heart-rate reserve, then 1–2 sets of 10–20 reps of two exercises in each functional category (squat, push, hinge, pull, carry, core), stretches and a cool-down. The band replaces the paper log and the "did that rep count?" guesswork. Built for ECE 198 at the University of Waterloo.</p>

    <section className="project-photo-section project-media-section" aria-label="IMU wristband media">
      <Photo file="band-prototype.jpg" alt="Arduino UNO R4 Minima taped to a black neoprene wrist support, with the accelerometer and pulse sensor on jumper leads" caption="The band prototype" width={1200} height={1600}/>
      <h2>Live demo</h2>
      <figure className="project-media-figure imu-video">
        <video autoPlay muted loop playsInline preload="metadata" poster={`${base}/imu-band-demo-poster.jpg`} aria-label="Rotating the wrist with the band on while the web app's angle dial follows the movement"><source src={`${base}/imu-band-demo.mp4`} type="video/mp4"/>Your browser does not support this video. <a href={`${base}/imu-band-demo.mp4`}>Open the demo clip</a></video>
        <figcaption>Rotating the wrist with the band on. The dial on the laptop follows the angle the band streams over USB</figcaption>
      </figure>
    </section>

    <section className="telemetry-validation"><h2>At a glance</h2><dl className="bedside-parts">{glance.map(item => <div key={item.name}><dt>{item.name}</dt><dd>{item.role}</dd></div>)}</dl></section>

    <section className="telemetry-validation"><h2>How it works</h2><ol className="telemetry-flow">
      <li>The MMA7361 feeds three analog axes into A0–A2 and the MAX30102 talks over I2C</li><li>The UNO R4 filters the angles, checks every heartbeat and builds one JSON sample</li><li>Every 50 ms the sample goes out over USB serial at 115200 baud (or over Wi-Fi on port 5555)</li><li>The React app calibrates the A and B angles and runs the rep and hold engine</li><li>Heart-rate zones are checked with the Karvonen formula and every set is saved locally</li>
    </ol></section>

    <section className="telemetry-validation"><h2>Firmware</h2><ul className="telemetry-task-list">
      <li><strong>Angles from gravity:</strong> Each axis is converted to g with <code>(raw·5 V/1023 − 1.65 V) / 0.8 V/g</code> and smoothed with an exponential filter (α = 0.05, about a 100 ms time constant). Pitch and roll come from <code>atan2</code> of the filtered gravity vector.</li>
      <li><strong>Roll is zeroed at power-up:</strong> The sketch waits 1.5 s for the filter to settle, stores the resting roll and reports roll relative to it, wrapped to ±180°. Roll is ignored when the tilt is under 0.3 g, where it is undefined.</li>
      <li><strong>Robust heart rate:</strong> The MAX30102 FIFO holds 32 samples (about 320 ms), so the loop services it at least every 250 ms and drops the buffer if it gets within 4 samples of overflowing. Beats are timestamped per sample (10 ms apart), not per loop. Readings over 220 bpm are treated as double detections, gaps implying under 30 bpm as missed beats, and no finger (IR under 50,000) or 3 s without a beat resets the reading. A bpm is only sent once 4 consecutive good beats agree.</li>
    </ul></section>

    <section className="telemetry-validation"><h2>Serial communication</h2><p>Every 50 ms the board prints one line:</p><pre className="abort-text-tree">{'{"pitch":-72.4,"roll":3.1,"gx":-0.951,"gy":0.054,"gz":0.302,"ir":81234,"bpm":72}'}</pre><p>The site reads it with the <strong>Web Serial API</strong>: open the port at 115200 baud, pipe it through a <code>TextDecoderStream</code>, split on newlines and <code>JSON.parse</code> each complete line. A partial line is held until the rest arrives, and a corrupted line is skipped instead of crashing the session. If the Arduino IDE's Serial Monitor is holding the port, the user gets a plain "port is busy" message. The same samples also arrive over Wi-Fi (HTTP polling with a 1.5 s timeout; 3 misses in a row marks the band offline), and a <code>?demo</code> mode simulates both sensors so the app works without hardware. Calibration and rep counting live in the browser, so the firmware never needs reflashing to add an exercise.</p></section>

    <div className="telemetry-report-grid">
      <section><h2>Rep counting</h2><ol className="telemetry-flow">
        <li>Strap the band where the app shows and capture the start (A) and end (B) angles</li><li>A rep counts at 85% of the range and resets within 15% of A</li><li>Turning back between 30% and 85% logs a short rep with the % reached</li><li>Holds only count time within ±12° of the start position</li><li>20 reps on both sets prompts you to add load</li>
      </ol></section>
      <section><h2>Heart-rate zones</h2><ul>
        <li>Target = rest + % × (max − rest), the Karvonen formula</li>
        <li>Default resting 70 and max 180 bpm give a 114–136 bpm cardio zone</li>
        <li>Warm-up and cool-down stay under 114 bpm</li>
        <li>Heart rate from the band, a Bluetooth strap, or typed in</li>
        <li>Machine tips for treadmill, recumbent bike and elliptical</li>
      </ul></section>
    </div>

    <section className="project-photo-section project-media-section" aria-label="Wiring and web app">
      <h2>Hardware and wiring</h2>
      <Photo file="wiring-diagram.png" alt="Wiring diagram: MAX30102 on SDA and SCL, MMA7361 X, Y and Z on A0 to A2, both powered from the Arduino" caption="MAX30102 on the I2C header, MMA7361 axes on A0 to A2" width={1080} height={586}/>
      <dl className="bedside-parts imu-wiring">{wiring.map(item => <div key={item.name}><dt>{item.name}</dt><dd>{item.role}</dd></div>)}</dl>

      <h2>The website</h2>
      <Photo file="site-home.png" alt="Session overview with warm-up and cardio zone, then exercise categories with calibration status" caption="Session overview: warm-up and cardio with your personal zone, then each exercise category with its calibration status" width={2160} height={1350}/>
      <Photo file="site-live-set.png" alt="Squat set in progress showing 4 reps, the 10 to 20 rep range, and a dial with angle, range and short-rep count" caption="A live squat set: rep counter, rep-by-rep bar for the 10–20 range, and a dial with the current angle, range reached and short reps" width={2160} height={1350}/>

      <h2>Sample session data</h2>
      <p className="telemetry-scope imu-sample-note">These charts are from a simulated session (the same signal shapes demo mode produces), to show what the band streams and what the app does with it.</p>
      <Photo file="chart-rep-trace.png" alt="Thigh pitch over a 48 second squat set with 14 full reps and one short rep" caption="A 48 s squat set at 20 Hz (960 samples). 14 reps cross the 85% line; the 10th movement only reaches about 62% and is logged as a short rep" width={1500} height={630}/>
      <Photo file="chart-heart-rate.png" alt="Heart rate across a 42 minute session staying in the 114 to 136 bpm zone during cardio" caption="Heart rate across a 42-minute session: 92% of cardio readings stay inside the 114–136 bpm zone" width={1500} height={630}/>
      <Photo file="chart-progression.png" alt="Average squat reps per set rising from 11 to 20 over 12 sessions" caption="Logged squat reps per set across one 12-session block, from 11 to 20 reps (+82%) until the app prompts to add load" width={1500} height={570}/>
    </section>

    <section className="telemetry-validation"><h2>Use of AI</h2><p>Claude Opus 5.5 was used as a coding assistant on the website. It did the repetitive work: building out the 16-exercise list and the matching page and styles for each exercise, and helping lay out and design parts of the UI. It also helped track down bugs, write tests and format the README. The hardware design, wiring, sensor choice, firmware logic and the CCCARE program mapping were done by the team, and all AI-written code was reviewed and tested on the band.</p></section>
  </section>
}
