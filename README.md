# Arjun Rose J S — Portfolio 4.0 / Systems in Motion

**Direction:** Hybrid immersive + editorial + cybernetic. The first visitor interaction is an engineering atlas: choose a discipline and enter the related interactive area. This version builds on Portfolio 3.0 without changing the original `Arjun_Rose_J_S` repository.

## Experience

- **Cinematic hero:** existing procedural Three.js 2-link robot digital twin.
- **Interactive Engineering Atlas:** four clickable spaces—robot motion, visual intelligence, industrial control and mechatronic design—with animated orbit geometry, responsive nodes and focused descriptions.
- **Engineering playground:** robot kinematics, PLC seal-in/E-stop simulation and a simulated waste perception-to-actuation workflow.
- **Project case files:** searchable projects with architecture and engineering detail.
- **Recruiter path:** resume, experience, capabilities and contact information.
- **Claude portfolio guide:** floating chat experience powered by a server-side API route. It is grounded in the portfolio facts and instructed not to invent qualifications, results or metrics.
- **Interaction polish:** responsive layout, reduced-motion support, theme switcher, keyboard command palette, accessible controls and lightweight procedural canvas effects.

## Tech stack

- Semantic HTML, CSS and vanilla JavaScript modules
- Three.js from jsDelivr for the 3D robot model
- Canvas-based procedural points and connection lines
- GitHub REST API for read-only public repository previews
- Vercel serverless function (`api/chat.js`) for the Claude Messages API
- GitHub Actions workflow for GitHub Pages static deployment

## Local preview

The 3D module and the browser modules should be served over HTTP rather than opened as `file://`.

```bash
python -m http.server 4173
```

Open `http://localhost:4173`. The portfolio itself works as a static site. On GitHub Pages, the Claude panel will display setup instructions until an API endpoint is configured.

## Claude assistant setup

The browser never receives the Anthropic API key. The key is read only by `api/chat.js` from the server environment.

### Option A — deploy the whole portfolio to Vercel (recommended for Claude)

1. Import the **new** repository `arjunrose/arjun-rose-portfolio` into Vercel.
2. Use the repository root as the project root and the **Other** framework preset; no frontend build command is required.
3. In Vercel → Project → Settings → Environment Variables, add:
   - `ANTHROPIC_API_KEY` — your Anthropic Console API key (secret)
   - `SITE_ORIGIN` — the exact production origin, for example `https://your-project.vercel.app` (no trailing slash)
   - `CLAUDE_MODEL` — optional; defaults to `claude-sonnet-5-5`
4. Deploy. The frontend will automatically call `/api/chat` on non-GitHub-Pages hosts.
5. Confirm the chat works with a low-cost test prompt. Anthropic API usage is billed by Anthropic; the portfolio does not include free Claude API credits.

### Option B — keep GitHub Pages as the website and host only the API on Vercel

1. Deploy the same repository to Vercel and configure `ANTHROPIC_API_KEY` as above.
2. Set `SITE_ORIGIN` to your Vercel production origin and add `https://arjunrose.github.io` to `ALLOWED_ORIGINS` in the Vercel project environment variables.
3. Edit `assistant-config.js` and set `window.ARJUN_CLAUDE_ENDPOINT` to your deployed endpoint, for example `https://your-project.vercel.app/api/chat`.
4. Commit and deploy the updated static files to GitHub Pages.

Never put `ANTHROPIC_API_KEY` in `assistant-config.js`, `app.js`, HTML, or any other public file. Rotate the key immediately if it is accidentally exposed.

### Model selection

The default is `claude-sonnet-5-5`, which Anthropic's current model overview lists as the balanced speed/intelligence Sonnet option. Change `CLAUDE_MODEL` on the server to another model ID supported by your Anthropic account; no client rebuild is needed for a model-only change.

## Deploy the static website to GitHub Pages

1. Extract this package into a new folder.
2. Open PowerShell in that folder and run `./publish.ps1`.
3. The script checks that the remote is exactly `https://github.com/arjunrose/arjun-rose-portfolio.git` and does not force-push.
4. In the **new repository only**, open Settings → Pages and select GitHub Actions as the source if necessary.
5. The included workflow deploys the static portfolio after a push to `main`.

This workflow deploys static files only. GitHub Pages does not execute `api/chat.js`; use Option A or Option B to enable Claude.

## Privacy and safety

- Chat messages are sent to the configured backend and then to Anthropic for model processing. The chat is not saved in browser storage by this frontend.
- Do not invite visitors to share credentials, private documents or confidential company information.
- The server function validates message length, checks allowed origins, applies a best-effort per-instance rate limit and keeps the API key server-side. For a high-traffic public launch, add a persistent rate-limit store and/or a CAPTCHA/Turnstile challenge.
- The Claude assistant is informational and not an autonomous agent. It cannot send emails, apply for jobs, or access private systems.

## Accuracy notes

- The 3D robot, PLC ladder circuit and computer-vision pipeline are browser simulations, not live hardware connections or actual ML inference.
- The waste-sorter description reflects a prototype architecture: ESP32-CAM capture, host/laptop YOLO inference and servo-based sorting. No unverified accuracy, throughput or yield numbers are claimed.
- The GitHub repository preview uses public read-only data.
- The contact form prepares a message in the visitor's email application.
- No disputed CGPA is published in this version.
