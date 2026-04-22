# GyroLux HTML App

Static HTML/CSS/JavaScript version of the facility layout optimizer.

## What changed
- No Streamlit dependency
- Pure client-side app, easy to host on static-site platforms
- Overlay sidebars for Departments and Workspace
- Layout grid first, metrics underneath
- Save / load / export controls moved to the bottom
- Browser localStorage persistence included
- JSON and XLSX import/export included with SheetJS via CDN

## Run locally
Just open `index.html` in a browser.

For the cleanest behavior, use a lightweight local server, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy
Any static host should work:
- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel
- Render Static Sites

## Notes
- The app stores the current state in browser localStorage.
- XLSX import/export depends on SheetJS from a public CDN.
- This version focuses on layout generation, scoring, slot saves, and practical Excel interoperability without server-side complexity.
