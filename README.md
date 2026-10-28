# Aiden’s personal website

React + TypeScript portfolio with Home, Skills, Projects, Experience, Extracurriculars, About, and Contact tabs.

Run `npm run dev` for local development and `npm run build` for a production build.

Use **Edit this site** in the footer to update text, add your GitHub and LinkedIn URLs, and upload a portrait and up to six extracurricular photos. Edits save to localStorage in the current browser only; they do not publish or sync. Photos are resized to a maximum of 1200 pixels before saving.

To change the public default content, update the `initial` profile in `src/App.tsx`. Skills, projects, experience, and extracurriculars use one entry per line. The profile name is an editable starting assumption; replace it if needed. No work history or skills have been invented.

A backend and authenticated editing would be needed for shared, persistent uploads. This starter does not include hosting or an admin service.
