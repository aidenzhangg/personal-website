# Aiden Zhang

Hey, my name is Aiden. I'm a first-year student at the University of Waterloo studying Computer Engineering. This is my portfolio website, where I share my experiences and some of the things I have built or am building. Feel free to contact me at [a522zhan@uwaterloo.ca](mailto:a522zhan@uwaterloo.ca) or [aidenzhangg.0@gmail.com](mailto:aidenzhangg.0@gmail.com).

The website is built with React, TypeScript, and Vite. It opens in a smaller Windows-inspired portfolio window with a slim taskbar. Use the maximize button to expand it. The window can be restored, moved, and minimized. `src/App.tsx` handles the main layout, navigation, and individual project pages. `src/profile.json` stores the projects, technical skills, experience, and certifications. `src/useWindowControls.ts` manages dragging, minimizing, maximizing, and restoring the window. `src/ProjectPhotos.tsx` displays project photos and website screenshots, while `src/ContactForm.tsx` submits messages to Formspree without leaving the page, preserves drafts on errors, and offers a copy option. The styles live in `src/App.css` and `src/index.css`, and images, icons, and PDFs are stored in `public/`. Run `npm install` followed by `npm run dev` to work on the site locally, or `npm run build` to create the production files in `dist/`.

You can access my personal website with this link: [aidenzhang.vercel.app](https://aidenzhang.vercel.app)


Contact submissions use the public Formspree endpoint configured in `src/ContactForm.tsx`. No API key or extra package is required. To use a different form, set `VITE_FORMSPREE_ENDPOINT` in `.env.local` for development or in Vercel environment variables, then rebuild or redeploy. The current endpoint works without an environment variable. Inbox delivery depends on the Formspree form being active and its recipient email verified.
