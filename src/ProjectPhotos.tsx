export function ProjectPhotos({ title }: { title: string }) {
  return <section className="project-photo-section" aria-label={`Photos for ${title}`}><h2>Photos</h2><div className="reserved-photo-grid">{[1, 2].map(slot => <div className="reserved-photo" key={slot}><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/></svg><span>Photo {slot}</span></div>)}</div></section>
}
