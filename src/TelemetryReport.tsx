const states = [
  { id: 'S,2', name: 'Takeoff' },
  { id: 'S,8', name: 'FlyToWaypoint' },
  { id: 'S,15', name: 'RepeatLap' },
  { id: 'S,18', name: 'WaitForReconComplete' },
]

export function TelemetryReport() {
  return <section className="telemetry-report" aria-label="Telemetry project report">
    <p className="telemetry-summary">I built a ROS 2 reporter for WARG that makes the drone's active behaviour visible in Mission Planner. It turns behaviour tree snapshots into compact MAVLink STATUSTEXT messages, helping operators see what the autonomy system is doing.</p>
    <div className="telemetry-report-grid">
      <section><h2>My contribution</h2><ul>
        <li>Processed behaviour tree snapshots to identify the deepest node in the RUNNING state</li>
        <li>Mapped nodes to numeric identifiers with a corresponding lookup table</li>
        <li>Published state changes through MAVROS and repeated the latest state approximately every 30 seconds</li>
      </ul></section>
      <section><h2>Telemetry path</h2><ol className="telemetry-flow">
        <li>ROS 2 behaviour tree snapshot</li><li>Deepest RUNNING node</li><li>Compact S,&lt;id&gt; message</li><li>MAVROS and MAVLink STATUSTEXT</li><li>Mission Planner Messages panel</li>
      </ol></section>
    </div>
    <section className="telemetry-states"><h2>Observed behaviour states</h2><dl>{states.map(state => <div key={state.id}><dt><code>{state.id}</code></dt><dd>{state.name}</dd></div>)}</dl></section>
    <section className="telemetry-validation"><h2>Simulation validation</h2><p>Using Docker, ArduPilot SITL, and Mission Planner, I checked reporter logs against received STATUSTEXT messages. Testing showed the four behaviour states above, state transitions, and periodic retransmission.</p><p className="telemetry-scope">A mismatch between mission waypoint coordinates and the simulated starting location affected navigation. These results validate the telemetry path and ground-station reception, rather than completion of the entire flight mission.</p></section>
  </section>
}
