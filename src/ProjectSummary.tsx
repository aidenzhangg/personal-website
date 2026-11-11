import './ProjectSummary.css'

const summaries: Record<string, string> = {
  'Computer Vision Food Recognition & Nutritional Analysis': 'Built a webcam nutrition app that identifies food with a fine-tuned YOLO model and reads nutrition facts aloud. Across five food categories, the detector reached 98% mAP50 on held-out validation and averaged 13.5 FPS.',
  'ROS 2 Behaviour Tree Telemetry Reporter - WARG': 'Pilots can see which autonomy step a drone is running through compact state IDs sent over MAVROS and MAVLink. Simulation testing confirmed four mission states in Mission Planner, with updates on state changes and periodic retransmission.',
  'Multi-Drone Deconfliction - WARG': 'Checks every drone\'s planned flight path against every other drone\'s and reports each place two come closer than a minimum separation. A sweep-and-prune version runs in O(S log S + C) instead of O(S²), and 200 random scenarios confirm it finds the same conflicts as brute force.',
  'Emergency Abort System - WARG': 'A ground-station ABORT command interrupts the drone mission and requests LAND through a behaviour-tree check and MAVROS. Bench tests confirmed command reception and transition to AbortLand, but did not demonstrate a completed landing.',
  'Recall - AI Study Assistant Chrome Extension': 'Turn pasted or uploaded notes into fill-in-the-blank quizzes directly in a Chrome side panel. A React interface, Spring Boot API, and PostgreSQL database support hints, retries, and saved questions and attempts.',
  'Autonomous Robot Navigation & LiDAR Mapping - WATonomous': 'Built a simulated robot navigation system using LiDAR maps, A* routes, and Pure Pursuit steering to avoid static obstacles. Our three-person team integrated the ROS 2 pipeline and inspected its navigation in Foxglove.',
  'Bedside Patient Monitoring System': 'Live heart-rate readings appear on an OLED while an Arduino samples optical pulse and movement sensors with signal filtering. The prototype clears invalid BPM readings when a finger is removed or a sensor fails.',
}

export function ProjectSummary({ title }: { title: string }) {
  const summary = summaries[title]
  if (!summary) return null
  return <section className="project-tldr" aria-label="Project summary"><h2>TL;DR</h2><p>{summary}</p></section>
}
