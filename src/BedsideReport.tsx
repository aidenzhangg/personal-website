import { ProjectPhotos } from './ProjectPhotos'
import './BedsideReport.css'

const parts = [
  { name: 'Arduino UNO R4 Minima', role: 'Runs the sensor loop, filters the readings, and drives the display and LED alerts. Powered and programmed over USB from the laptop' },
  { name: 'MAX30102 pulse sensor', role: 'Shines red and infrared light into the fingertip and measures how much comes back. Each heartbeat changes the amount of blood in the finger, so the reflected light rises and falls with the pulse' },
  { name: 'MMA7361 accelerometer', role: 'Measures acceleration on three axes as an analog voltage per axis, read through the Arduino ADC. Used to track movement and activity' },
  { name: '0.96" OLED display (I2C)', role: 'Shows the boot screen, a "Place finger" prompt when no finger is detected, and the live BPM' },
  { name: 'Breadboard and jumper wires', role: 'Distribute power and ground to the modules. The pulse sensor and OLED both talk to the Arduino over I2C (SDA and SCL)' },
]

export function BedsideReport() {
  return <section className="telemetry-report" aria-label="Bedside monitoring project report">
    <p className="telemetry-summary">A breadboard prototype of a bedside monitor that measures heart rate from a fingertip and tracks movement, then shows the live reading on a small OLED screen. It is the hardware half of a larger project: the next stage connects these sensor readings to a multimodal AI platform for early delirium risk detection.</p>

    <ProjectPhotos title="Bedside Patient Monitoring System"/>

    <section className="telemetry-validation"><h2>What it does</h2><p>When it powers on, the monitor shows a <code>HID Monitor v0.1</code> boot screen, then asks you to place a finger on the sensor. Once a finger is detected, it starts measuring and shows your heart rate in beats per minute. If the finger is removed or the sensor stops responding, it clears the reading and goes back to the prompt instead of showing a stale or made-up number.</p><p>The last photo above shows a live reading of 93 BPM taken with a fingertip on the sensor.</p></section>

    <section className="telemetry-validation"><h2>Hardware</h2><dl className="bedside-parts">{parts.map(part => <div key={part.name}><dt>{part.name}</dt><dd>{part.role}</dd></div>)}</dl></section>

    <div className="telemetry-report-grid">
      <section><h2>How a reading is made</h2><ol className="telemetry-flow">
        <li>The MAX30102 samples reflected light from the fingertip</li><li>The Arduino filters out noise and slow drift</li><li>Peaks in the signal are detected and timed</li><li>The time between beats becomes a BPM value</li><li>The OLED shows the reading, or a prompt if no finger is detected</li>
      </ol></section>
      <section><h2>Firmware skills</h2><ul>
        <li>I2C communication with the pulse sensor and display</li>
        <li>ADC reads of the three accelerometer axes</li>
        <li>UART serial for debugging over USB</li>
        <li>Non-blocking timing so no sensor stalls the others</li>
        <li>Basic signal filtering and peak detection</li>
      </ul></section>
    </div>

    <section className="telemetry-validation"><h2>How the firmware is structured</h2><ul className="telemetry-task-list">
      <li><strong>Non-blocking loop:</strong> Each sensor is read on its own schedule using timers instead of <code>delay()</code>. A slow display update never makes the pulse sensor miss samples, and the accelerometer keeps being read while a beat is being measured.</li>
      <li><strong>Signal filtering:</strong> The raw light signal includes noise and a slow drift from how hard the finger presses. Filtering removes both so the peaks from each heartbeat stand out clearly enough to time.</li>
      <li><strong>Sensor-status handling:</strong> The firmware checks whether a finger is actually on the sensor and whether the sensor is still responding. If either check fails, it clears the BPM and shows the "Place finger" prompt or an error, so the screen never shows a number that isn't being measured.</li>
      <li><strong>Activity alerts:</strong> Accelerometer readings are tracked over time, and an LED alert turns on when activity stays high for longer than a set threshold. A single bump doesn't trigger it; sustained movement does.</li>
    </ul></section>

    <section className="telemetry-validation"><h2>How the project is changing</h2><p>Version 0.1 is a standalone device: the Arduino measures, decides and displays everything itself. The next version turns it into a sensor node. The Arduino will keep measuring and displaying, but it will also send every reading to a laptop, where software can store it, chart it, and combine it with other signals.</p><p>This is the first step toward a <strong>multimodal AI platform for early delirium detection</strong> in clinical settings. Delirium is a sudden change in attention and awareness that is common in ICU patients and easy to miss between assessments. The platform will combine this hardware with computer vision, speech analysis and sleep tracking, aligned with standard ICU assessment protocols.</p></section>

    <section className="telemetry-validation"><h2>What I'm building next</h2><div className="bedside-stage">
      <h3>1. Stream the readings to Python</h3><p>Send each reading from the Arduino as one line, such as <code>timestamp_ms, heart_rate_bpm, accel_x, accel_y, accel_z</code>, and read it on the laptop with <code>pyserial</code>. Check that BPM follows the real pulse and that the accelerometer responds when the sensor moves.</p>
      <h3>2. Store and serve the data</h3><p>Build a FastAPI backend that timestamps, validates and saves each reading to PostgreSQL, so heart-rate and movement trends can be reviewed over hours instead of seconds.</p>
      <h3>3. Live dashboard</h3><p>Build a React dashboard with live heart-rate and movement charts, recent trends, and sensor status.</p>
      <h3>4. Add vision and speech</h3><p>A computer vision pipeline using OpenCV, MediaPipe and DeepFace for facial expression, restlessness and gaze changes. A speech pipeline using Whisper with spaCy and NLTK to score response delay, disorganized speech and memory-related answers.</p>
      <h3>5. Combine everything into a risk score</h3><p>An ensemble model (Random Forest plus Logistic Regression) that combines heart-rate, movement, vision and speech features into a 0 to 100 risk score, updated every 15 minutes. All processing runs locally, so patient data never leaves the device.</p>
    </div><p className="telemetry-scope">The risk score is a research indicator, not a diagnosis. Heart rate, movement, facial expression and speech are not enough on their own to confirm delirium. Before making detection claims, the model would need training and validation against established clinical assessments such as CAM-ICU, using properly collected patient data.</p></section>
  </section>
}
