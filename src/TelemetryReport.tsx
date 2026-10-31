const states = [
  { id: 'S,2', name: 'Takeoff' },
  { id: 'S,8', name: 'FlyToWaypoint' },
  { id: 'S,15', name: 'RepeatLap' },
  { id: 'S,18', name: 'WaitForReconComplete' },
]

export function TelemetryReport() {
  return <section className="telemetry-report" aria-label="Telemetry project report">
    <p className="telemetry-summary">I built a ROS 2 reporter for WARG that makes the drone's active behaviour visible in Mission Planner. It turns behaviour tree snapshots into compact MAVLink STATUSTEXT messages, helping operators see what the autonomy system is doing.</p>
    <section className="telemetry-validation"><h2>Why I built it</h2><p>WARG uses behaviour trees to coordinate tasks such as takeoff, waypoint navigation, reconnaissance, and landing. Standard flight telemetry shows the aircraft's motion and flight-controller status, but it does not necessarily explain which task the autonomy software is executing.</p><p>My contribution was a reporting component within the existing autonomy system. It connects internal behaviour tree execution data to the ground station, giving operators and developers another way to understand mission progress and investigate unexpected behaviour.</p></section>
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
    <section className="telemetry-validation"><h2>Finding the active behaviour</h2><p>The reporter subscribes to ROS 2 behaviour tree snapshots containing the tree structure and each node's execution status. It processes that hierarchy to find the deepest node currently marked RUNNING. Reporting this node makes the message more specific than reporting only a high-level mission phase.</p><p>For example, the tree can contain an active mission branch while a more specific child behaviour handles waypoint navigation. The reporter selects that active child and maps it to its numeric identifier.</p></section>
    <section className="telemetry-validation"><h2>Compact messages over MAVLink</h2><p>I mapped behaviour nodes to numeric identifiers and generated a lookup table so each identifier can be translated back into a behaviour name. The reporter sends a short message such as <code>S,8</code> instead of transmitting the full behaviour name. In the tested tree, that identifier represents <code>FlyToWaypoint</code>.</p><p>Messages are published through MAVROS and delivered to Mission Planner as MAVLink STATUSTEXT. This uses the existing ground-station Messages panel, allowing the telemetry to be inspected alongside other flight messages without building a separate monitoring interface.</p><p>The reporter publishes when the active behaviour changes and repeats the latest state approximately every 30 seconds. Change-based updates limit repeated traffic between transitions, while periodic retransmission keeps the most recently reported behaviour visible during longer tasks.</p></section>
    <section className="telemetry-states"><h2>Observed behaviour states</h2><dl>{states.map(state => <div key={state.id}><dt><code>{state.id}</code></dt><dd>{state.name}</dd></div>)}</dl></section>
    <section className="telemetry-validation"><h2>Simulation validation</h2><p>I ran the autonomy software and reporting component in Docker, used ArduPilot Software-in-the-Loop (SITL) as the simulated aircraft and flight controller, and monitored received messages in Mission Planner. This let me test the reporting path without physical flight hardware.</p><p>I compared the reporter's container logs with Mission Planner's Messages panel to check that detected behaviours were encoded, published, and received at the ground station. The tests showed Takeoff, FlyToWaypoint, RepeatLap, and WaitForReconComplete identifiers, along with transitions and periodic retransmission of the last reported state.</p><p className="telemetry-scope">A mismatch between mission waypoint coordinates and the simulated starting location affected navigation. These results validate the telemetry path and ground-station reception, rather than completion of the entire flight mission.</p></section>
    <section className="telemetry-validation"><h2>Integration challenges</h2><p>The main challenge was translating a hierarchy of running behaviours into one useful status message, then following that message across ROS 2, MAVROS, the simulated flight controller, and Mission Planner. Comparing container logs with ground-station messages helped distinguish a reporting issue from a navigation or simulation setup issue.</p><p>The result was a demonstrated end-to-end reporting path for the tested behaviour states. This work strengthened my experience with Python, ROS 2 integration, behaviour trees, MAVLink telemetry, Docker-based simulation, and debugging across multiple software components.</p></section>
  </section>
}
