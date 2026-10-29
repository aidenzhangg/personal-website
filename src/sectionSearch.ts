const aliases: Record<string, string> = {
 About: 'about home intro introduction aiden',
 Projects: 'projects project work built robotics drone recall computer vision',
 'Technical Skills': 'technical skills skill tech technology technologies programming languages hardware software',
 Experience: 'experience employment job jobs work camp counsellor counselor teams',
 Extracurriculars: 'extracurriculars extracurricular activities volunteering volunteer clubs piano basketball tutoring deca fbla',
 Certifications: 'certifications certification certificates certificate csmc first aid cpr high five rcm',
 Resume: 'resume cv curriculum vitae pdf',
 Portfolio: 'portfolio work pdf',
 Education: 'education school university waterloo degree engineering',
 Contact: 'contact email message mail connect',
}
function normalize(value: string) { return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim() }
export function matchSections<T extends string>(sections: readonly T[], query: string): T[] {
 const normalized = normalize(query)
 if (!normalized) return [...sections]
 const exact = sections.filter(section => normalize(section) === normalized)
 const tokens = normalized.split(/\s+/)
 const matches = sections.filter(section => tokens.every(token => normalize(`${section} ${aliases[section] || ''}`).split(' ').some(word => word.startsWith(token))))
 return [...exact, ...matches.filter(section => !exact.includes(section))]
}
