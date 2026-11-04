import './FoodVisuals.css'

// Values from foodhealthchecker.py: food_categorization, DAILY_VALUES, HEALTH_HEX,
// CONFIDENCE_THRESHOLD = 0.50, HOLD_FRAMES = 8, FRAME_W x FRAME_H = 640 x 480
const HEALTH = { Healthy: '#1E7B3C', Neutral: '#E0A100', Unhealthy: '#C62F1D' } as const
type Rating = keyof typeof HEALTH
const DAILY = { fat: 78, carbs: 275, protein: 50 }
const FOODS: { name: string; rating: Rating; kcal: number; fat: number; carbs: number; protein: number }[] = [
  { name: 'Eggs', rating: 'Healthy', kcal: 155, fat: 11.0, carbs: 1.1, protein: 13.0 },
  { name: 'Chocolate', rating: 'Unhealthy', kcal: 598, fat: 42.6, carbs: 46.4, protein: 7.8 },
  { name: 'Bread', rating: 'Neutral', kcal: 265, fat: 3.2, carbs: 49.0, protein: 9.0 },
  { name: 'Pizza', rating: 'Unhealthy', kcal: 266, fat: 10.0, carbs: 33.0, protein: 11.0 },
  { name: 'Apples', rating: 'Healthy', kcal: 61, fat: 0.15, carbs: 14.8, protein: 0.13 },
]
const dv = (grams: number, ref: number) => Math.round((grams / ref) * 100)

const STEPS = [
  { title: 'Capture', code: 'cv2.VideoCapture(0)', text: 'Resize to 640 × 480 and mirror the frame' },
  { title: 'Detect', code: 'best.pt · YOLO11', text: 'Inference limited to the five food classes' },
  { title: 'Filter', code: 'conf ≥ 0.50', text: 'Drop weak boxes, sort by confidence' },
  { title: 'Draw', code: 'draw_detections()', text: 'Box in the health colour, thicker for the top food' },
  { title: 'Look up', code: 'food_categorization', text: 'Nutrition per 100 g for the top food' },
  { title: 'Speak', code: 'Windows SAPI queue', text: 'Read aloud only when the top food changes' },
]

function Pipeline() {
  return <ol className="fv-pipe">{STEPS.map((s, i) => <li key={s.title}>
    <span className="fv-num">{i + 1}</span>
    <b>{s.title}</b>
    <code>{s.code}</code>
    <p>{s.text}</p>
  </li>)}</ol>
}

function Tag({ x, y, text, color, dark }: { x: number; y: number; text: string; color: string; dark?: boolean }) {
  const w = text.length * 11 + 18
  return <g><rect x={x} y={y - 30} width={w} height="30" fill={color}/><text x={x + 9} y={y - 9} className="fv-tag" fill={dark ? '#000' : '#fff'}>{text}</text></g>
}

function DetectionFrame() {
  return <svg className="fv-frame" viewBox="0 0 640 480" role="img" aria-label="Webcam frame with an egg detected at 85 percent, bread at 72 percent, and a pizza box at 38 percent that is dropped by the confidence filter">
    <defs>
      <linearGradient id="fv-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5d5a55"/><stop offset="1" stopColor="#3b3935"/></linearGradient>
      <radialGradient id="fv-egg" cx=".4" cy=".35" r=".7"><stop offset="0" stopColor="#fbf3e6"/><stop offset="1" stopColor="#d9c6a8"/></radialGradient>
    </defs>
    <rect width="640" height="480" fill="url(#fv-bg)"/>
    <rect y="350" width="640" height="130" fill="#2e2c29"/>
    <ellipse cx="420" cy="388" rx="170" ry="38" fill="#e8e6e1"/><ellipse cx="420" cy="384" rx="138" ry="26" fill="#f4f2ee"/>
    <path d="M330 382 q-8-70 40-78 q30-30 70-4 q45 4 40 78 z" fill="#c98a45"/><path d="M342 380 q-4-58 32-64 q28-24 60-2 q36 6 32 66 z" fill="#efd3a2"/>
    <path d="M70 330 q12-60 70-80 l-6 90 z" fill="#d7b38d"/>
    <ellipse cx="170" cy="210" rx="58" ry="74" fill="url(#fv-egg)"/>
    <path d="M112 260 q20 40 70 36 q30-4 40-30 l18 110 h-140 z" fill="#d7b38d"/>
    <g opacity=".55"><path d="M540 40 l90 0 l-45 80 z" fill="#d8a24a"/><circle cx="570" cy="60" r="7" fill="#b03a2e"/><circle cx="596" cy="58" r="6" fill="#b03a2e"/></g>

    <rect x="108" y="130" width="126" height="164" fill="none" stroke={HEALTH.Healthy} strokeWidth="5"/>
    <Tag x={108} y={130} text="Eggs  85%" color={HEALTH.Healthy}/>
    <rect x="322" y="290" width="168" height="98" fill="none" stroke={HEALTH.Neutral} strokeWidth="3"/>
    <Tag x={322} y={290} text="Bread  72%" color={HEALTH.Neutral} dark/>
    <rect x="532" y="34" width="104" height="94" fill="none" stroke="#bdbdbd" strokeWidth="2" strokeDasharray="8 6"/>
    <text x="628" y="150" className="fv-drop" textAnchor="end">Pizza 38%</text>
    <text x="628" y="168" className="fv-drop" textAnchor="end">below 0.50, dropped</text>

    <text x="14" y="30" className="fv-fps">FPS: 13.5</text>
  </svg>
}

function NutritionLabel() {
  const egg = FOODS[0]
  const rows = [['Total fat', egg.fat, DAILY.fat], ['Total carbohydrate', egg.carbs, DAILY.carbs], ['Protein', egg.protein, DAILY.protein]] as const
  return <div className="fv-label" aria-label="Nutrition panel for eggs">
    <div className="fv-label-head">Nutrition Facts</div>
    <div className="fv-label-food">Eggs <span>85%</span></div>
    <div className="fv-label-serving">Serving size 100 g</div>
    <div className="fv-label-cal"><span>Calories</span><b>{egg.kcal}</b></div>
    <div className="fv-label-dv">% Daily Value*</div>
    {rows.map(([name, grams, ref]) => <div className="fv-label-row" key={name}>
      <span><b>{name}</b> {grams} g</span><b>{dv(grams, ref)}%</b>
      <i><em style={{ width: `${Math.min(100, (grams / ref) * 100)}%` }}/></i>
    </div>)}
    <div className="fv-label-rating"><span>Health rating</span><b style={{ background: HEALTH[egg.rating] }}>{egg.rating}</b></div>
    <div className="fv-label-note">*Daily values: fat 78 g, carbs 275 g, protein 50 g</div>
  </div>
}

function FoodTable() {
  const maxKcal = Math.max(...FOODS.map(f => f.kcal))
  return <div className="fv-table" role="table" aria-label="Nutrition lookup table per 100 grams">
    <div className="fv-tr fv-th" role="row"><span>Food</span><span>Rating</span><span>Calories</span><span>Fat</span><span>Carbs</span><span>Protein</span></div>
    {FOODS.map(f => <div className="fv-tr" role="row" key={f.name}>
      <span className="fv-food"><i style={{ background: HEALTH[f.rating] }}/>{f.name}</span>
      <span><b className="fv-pill" style={{ background: HEALTH[f.rating], color: f.rating === 'Neutral' ? '#000' : '#fff' }}>{f.rating}</b></span>
      <span className="fv-kcal"><em style={{ width: `${(f.kcal / maxKcal) * 100}%` }}/><b>{f.kcal}</b></span>
      {([[f.fat, DAILY.fat], [f.carbs, DAILY.carbs], [f.protein, DAILY.protein]] as const).map(([g, ref], i) =>
        <span key={i} className="fv-macro"><b>{g} g</b><small>{dv(g, ref)}%</small></span>)}
    </div>)}
  </div>
}

function HoldFrames() {
  const frames = [...Array(3).fill('hit'), ...Array(8).fill('held'), 'clear'] as const
  return <div className="fv-hold">
    <div className="fv-strip">{frames.map((kind, i) => <div key={i} className={`fv-cell fv-${kind}`}>
      <span>{i + 1}</span>
      <small>{kind === 'hit' ? 'Eggs' : kind === 'held' ? `miss ${i - 2}` : 'miss 9'}</small>
    </div>)}</div>
    <div className="fv-hold-key">
      <span><i className="fv-hit"/>YOLO detects the egg</span>
      <span><i className="fv-held"/>No detection, last box kept (up to 8 frames)</span>
      <span><i className="fv-clear"/>9th miss in a row, boxes cleared</span>
    </div>
  </div>
}

export function FoodHowItWorks() {
  return <div className="fv">
    <figure className="project-media-figure">
      <div className="fv-card"><Pipeline/></div>
      <figcaption>Each frame passes through these six steps in a background camera thread. Speech runs in its own queue so reading a result never pauses detection</figcaption>
    </figure>

    <figure className="project-media-figure">
      <h3>What the detector returns</h3>
      <div className="fv-card fv-split"><DetectionFrame/><NutritionLabel/></div>
      <figcaption>Illustration of one frame. Every detection has a name, a confidence score, and a box. Boxes below 50% are dropped. The most confident food gets the thicker box and fills the nutrition panel. Box colours come from the health rating</figcaption>
    </figure>

    <figure className="project-media-figure">
      <h3>Nutrition lookup table</h3>
      <div className="fv-card"><FoodTable/></div>
      <figcaption>The five supported foods and their reference values per 100 g. Daily-value percentages are round(grams ÷ daily value × 100). The app looks these up by name; it does not weigh the food</figcaption>
    </figure>

    <figure className="project-media-figure">
      <h3>Keeping boxes steady between frames</h3>
      <div className="fv-card"><HoldFrames/></div>
      <figcaption>If YOLO briefly loses the food, the last detections stay on screen for up to eight missed frames (HOLD_FRAMES = 8). This stops boxes flickering, but it does not fix a wrong label</figcaption>
    </figure>
  </div>
}
