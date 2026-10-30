# Arjun Rose J S — Interactive Engineering Portfolio

A custom, responsive portfolio designed around robotics, industrial automation, embedded hardware and applied AI. The site is static-first: it can be published free on GitHub Pages, and an optional Vercel serverless endpoint can deliver contact messages through Resend.

## Included experiences

- Particle-field hero, custom robotic-arm artwork, motion-aware layout and dark/light themes.
- Interactive 2-link inverse-kinematics arm (drag the target to calculate joint angles).
- PLC start/stop/reset seal-in circuit visualisation.
- Searchable and filterable project gallery with technical detail panels.
- Featured automatic waste-sorting system architecture.
- Industrial experience timeline, hardware platform list, skill matrix and selected credentials.
- Live read-only public GitHub repository preview.
- Local portfolio guide and `Ctrl/Cmd + K` command palette.
- Recruiter view that prioritises selected projects, experience and contact information.
- Contact form with a mailto fallback; optional Vercel + Resend delivery endpoint.

## Run locally

No front-end package installation is required. With Python 3 installed:

```bash
python3 -m http.server 4173
```

Open <http://localhost:4173>.

## Publish on GitHub Pages

1. Create a **new public repository** named `arjun-rose-portfolio`. Do not reuse `Arjun_Rose_J_S`.
2. Upload all files and folders from this project to the root of the new repository.
3. The included GitHub Actions workflow deploys the site whenever you push to `main`.
4. In the new repository, open **Settings → Pages** and select **GitHub Actions** as the build and deployment source.
5. The expected project URL will be `https://arjunrose.github.io/arjun-rose-portfolio/`.

No build step or npm install is required for GitHub Pages.

## Optional real contact delivery (Vercel + Resend)

GitHub Pages is static hosting and cannot execute the `/api/contact.js` function. To enable direct form delivery, import this same repository into Vercel and add these environment variables:

- `RESEND_API_KEY` — API key from Resend.
- `CONTACT_TO` — inbox that should receive portfolio messages (for example, `arjunrose2005@gmail.com`).
- `CONTACT_FROM` — a sender address/domain verified in your Resend account.

Deploy on Vercel. Until those variables are configured, or when the static GitHub Pages site is used, the form falls back to opening the visitor's email application with the message prefilled. Do not commit API keys or email-provider secrets to Git.

## Personal details to verify before public launch

- Confirm the degree status and graduation wording.
- Confirm the academic CGPA before publishing it; no CGPA is displayed in this version because the available sources disagree.
- Replace the GitHub avatar with a preferred professional portrait if desired.
- Add a current PDF résumé and project photos/videos when ready.
- Add direct repository/demo links to individual project panels when you identify the exact public repositories.

## Technical notes

The site is plain HTML, CSS and browser JavaScript. The IK arm, PLC circuit simulation, particle field and portfolio guide execute locally. The portfolio guide is a deterministic navigation helper, not an LLM chatbot. The GitHub repository radar uses GitHub's public unauthenticated API and gracefully falls back to a profile link if the API is unavailable.
