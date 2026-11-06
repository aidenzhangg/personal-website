import './ProjectSummary.css'

const summaries: Record<string, string> = {
  'Computer Vision Food Recognition & Nutritional Analysis': 'Built a webcam nutrition app using a fine-tuned YOLO detector and spoken feedback. It recognizes five food categories, achieved 98% mAP50 on held-out validation, and averaged 13.5 FPS.',
  'ROS 2 Behaviour Tree Telemetry Reporter - WARG': 'Built a drone telemetry reporter that sends compact behaviour-tree state IDs through MAVROS and MAVLink. Simulation tests confirmed four mission states arriving in Mission Planner, with updates on changes and periodic retransmission.',
  'Emergency Abort System - WARG': 'Built an emergency-abort behaviour that checks ground-station commands each cycle and requests LAND through MAVROS. Bench testing confirmed ABORT reception and transition to AbortLand; a completed landing was not demonstrated.',
  'Recall - AI Study Assistant Chrome Extension': 'Built a Chrome study assistant with React, Spring Boot, and PostgreSQL. It turns pasted or uploaded notes into fill-in-the-blank quizzes with hints, retries, and stored questions and attempts.',
  'Autonomous Robot Navigation & LiDAR Mapping - WATonomous': 'Worked in a team of three to build a ROS 2 navigation stack using LiDAR mapping, A* planning, and Pure Pursuit control. The integrated robot navigated around static obstacles in simulation, with its map and motion inspected in Foxglove.',
  'Bedside Patient Monitoring System': 'Built an Arduino bedside-monitor prototype using optical heart-rate sensing, movement sensing, and signal filtering. It displays live BPM on an OLED and clears invalid readings when a finger is removed or a sensor fails.',
}

export function ProjectSummary({ title }: { title: string }) {
  const summary = summaries[title]
  if (!summary) return null
  return <section className="project-tldr" aria-label="Project summary"><h2>TL;DR</h2><p>{summary}</p></section>
}
