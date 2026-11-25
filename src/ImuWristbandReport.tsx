import './ImuWristbandReport.css'

const base = '/projects/imu-wristband'

const parts = [
  { name: 'Arduino UNO R4 Minima', role: 'Reads both sensors, filters the angles, checks every heartbeat and streams one JSON sample every 50 ms over USB' },
  { name: 'MMA7361 accelerometer', role: 'Three analog outputs (X, Y, Z on A0 to A2) read through the ADC. Gravity on each axis gives the pitch and roll of the limb it is strapped to' },
  { name: 'MAX30102 pulse sensor', role: 'Measures reflected infrared light over I2C at 400 samples per second, averaged in hardware to 100 per second, to find each heartbeat' },
  { name: 'Wearable strap', role: 'Holds the board on the forearm, with the sensors on short leads so they can go on the upper arm, thigh or chest depending on the exercise' },
]

export function ImuWristbandReport() {
  return <section className="telemetry-report" aria-label="IMU exercise wristband project report">
    <p className="telemetry-summary">A wearable band that tracks exercise as you do it. An Arduino reads a 3-axis accelerometer and a pulse sensor, streams the limb angle and heart rate to a web app 20 times a second, and the app counts reps, catches short reps, keeps you in your heart-rate zone and logs every set. The session follows the <strong>CCCARE</strong> exercise program from the University of Waterloo. Built in a team for ECE 198.</p>

    <section className="project-photo-section project-media-section" aria-label="IMU wristband media">
      <h2>Live demo</h2>
      <figure className="project-media-figure imu-video">
        <video autoPlay muted loop playsInline preload="metadata" poster={`${base}/imu-band-demo-poster.jpg`} aria-label="Rotating the wrist with the band on while the web app's angle dial follows the movement"><source src={`${base}/imu-band-demo.mp4`} type="video/mp4"/>Your browser does not support this video. <a href={`${base}/imu-band-demo.mp4`}>Open the demo clip</a></video>
        <figcaption>Rotating the wrist with the band on. The dial on the laptop follows the angle the band streams over USB</figcaption>
      </figure>

      <div className="imu-photo-pair">
        <figure><a href={`${base}/band-on-wrist.jpg`} target="_blank" rel="noreferrer" aria-label="Open photo of the band on the wrist"><img src={`${base}/band-on-wrist.jpg`} alt="Arduino UNO R4 Minima strapped to a forearm, with the accelerometer and pulse sensor on jumper leads" loading="lazy"/></a><figcaption>The band on the forearm, sensors on short leads</figcaption></figure>
        <figure><a href={`${base}/sensors-and-board.jpg`} target="_blank" rel="noreferrer" aria-label="Open photo of the sensors and board"><img src={`${base}/sensors-and-board.jpg`} alt="Hand holding the MMA7361 accelerometer and MAX30102 pulse sensor wired to the Arduino" loading="lazy"/></a><figcaption>MMA7361 accelerometer and MAX30102 pulse sensor</figcaption></figure>
      </div>

      <h2>Wiring</h2>
      <figure className="project-media-figure"><a href={`${base}/wiring-diagram.png`} target="_blank" rel="noreferrer" aria-label="Open wiring diagram"><img src={`${base}/wiring-diagram.png`} alt="Wiring diagram: MAX30102 on SDA and SCL, MMA7361 X, Y and Z on A0 to A2, both powered from the Arduino" width="1080" height="586" loading="lazy"/></a><figcaption>MAX30102 on the I2C header, MMA7361 axes on A0 to A2</figcaption></figure>

      <h2>Web app</h2>
      <figure className="project-media-figure"><a href={`${base}/website-live-set.png`} target="_blank" rel="noreferrer" aria-label="Open web app screenshot"><img src={`${base}/website-live-set.png`} alt="Web app during a squat set showing 4 reps, the 10 to 20 rep range, and a dial with angle, range and short-rep count" width="2160" height="1350" loading="lazy"/></a><figcaption>A squat set in progress: rep count, the 10 to 20 rep target, and the live angle, range reached and short reps</figcaption></figure>
    </section>

    <section className="telemetry-validation"><h2>Hardware</h2><dl className="bedside-parts">{parts.map(part => <div key={part.name}><dt>{part.name}</dt><dd>{part.role}</dd></div>)}</dl></section>

    <div className="telemetry-report-grid">
      <section><h2>How a rep is counted</h2><ol className="telemetry-flow">
        <li>Strap the band where the app shows and capture the start (A) and end (B) angles</li><li>Each sample becomes progress along A to B</li><li>Reaching 85% of the range and returning within 15% of A counts a rep</li><li>Turning back between 30% and 85% logs a short rep with the % reached</li><li>The set is saved with reps, short reps and load</li>
      </ol></section>
      <section><h2>Firmware skills</h2><ul>
        <li>ADC reads of three analog accelerometer axes</li>
        <li>I2C with the MAX30102 and its 32-sample FIFO</li>
        <li>UART serial at 115200 baud with a fixed JSON format</li>
        <li>Exponential filtering (α = 0.05, about 100 ms)</li>
        <li>Beat detection with outlier rejection</li>
      </ul></section>
    </div>

    <section className="telemetry-validation"><h2>Serial communication</h2><p>Every 50 ms the Arduino prints one line, for example <code>{'{"pitch":-72.4,"roll":3.1,"ir":81234,"bpm":72}'}</code>. The website opens the port at 115200 baud with the Web Serial API, splits the stream on newlines and parses each complete line. A half-received line waits for the rest, and a corrupted line is skipped instead of breaking the session. Keeping calibration and rep counting in the browser means the firmware never needs reflashing to add an exercise.</p></section>

    <section className="telemetry-validation"><h2>Getting reliable readings</h2><ul className="telemetry-task-list">
      <li><strong>Stable angles:</strong> Each axis is converted to g, smoothed, and turned into pitch and roll with <code>atan2</code>. Roll is zeroed 1.5 s after power-up and ignored when the tilt is too small to measure.</li>
      <li><strong>No lost heartbeats:</strong> The pulse sensor's buffer fills in about 320 ms, so the loop empties it at least every 250 ms and resets the reading if it nearly overflows. Each beat gets its own 10 ms sample timestamp, not the loop time.</li>
      <li><strong>No fake heart rates:</strong> Beats faster than 220 bpm are treated as double detections and gaps under 30 bpm as missed beats. A reading is only sent after 4 good beats in a row, and it clears when the finger is removed.</li>
    </ul></section>

    <section className="telemetry-validation"><h2>The CCCARE session</h2><p>The app walks through the full program: a 3 to 5 minute warm-up, 15 to 30 minutes of cardio at 40 to 60% of heart-rate reserve (114 to 136 bpm with the default resting and max heart rates), then 1 to 2 sets of 10 to 20 reps for 16 exercises across squat, push, hinge, pull, carry and core, followed by stretches and a cool-down. Holds like planks only count time while you stay within 12° of position, and once you reach 20 reps on both sets the app prompts you to add load.</p><p className="telemetry-scope">AI use: Claude Opus 5.5 helped with the repetitive parts of the web app, like building out the exercise list and matching pages, and with debugging and tests. The hardware, wiring, firmware logic and program design were done by the team.</p></section>
  </section>
}
