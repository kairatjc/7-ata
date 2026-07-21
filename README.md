# Ногой санжырасы — Interactive Kyrgyz Family Tree

> An interactive genealogy ("санжыра") that renders a **235-person** ancestral tree in the browser — searchable, zoomable, and pan-able — with zero frameworks and zero build step. Live at **[kairat.me](https://kairat.me)**.

<p align="center">
  <img alt="Vanilla JS" src="https://img.shields.io/badge/Vanilla%20JS-no%20framework-f7df1e?style=flat-square&logo=javascript&logoColor=black">
  <img alt="SVG" src="https://img.shields.io/badge/Rendering-SVG-ff6f00?style=flat-square">
  <img alt="Cloudflare" src="https://img.shields.io/badge/Deploy-Cloudflare%20Workers-f38020?style=flat-square&logo=cloudflare&logoColor=white">
  <img alt="CI" src="https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088ff?style=flat-square&logo=githubactions&logoColor=white">
  <img alt="Built with Claude" src="https://img.shields.io/badge/Built%20with-Claude-d97757?style=flat-square">
</p>

---

## ✨ What it does

**Санжыра** is the Kyrgyz oral tradition of tracing lineage through the male line, often memorized back seven generations ("жети ата"). This project turns that oral tradition into a living, interactive visualization.

- 🌳 **Auto-laid-out family tree** — 235 people across multiple generations, drawn as a clean SVG diagram with the direct ancestral line ("түз ата-тек") centered and highlighted.
- 🔍 **Instant search** — find any name as you type, with a live match count.
- 🎯 **Branch filtering** — jump between the *Карач* and *Манас* branches, or view everyone at once.
- 🧭 **Pan & zoom** — drag to move, scroll to zoom, plus fit-to-screen and reset controls.
- 👤 **Person detail panel** — tap anyone to see their ancestral path, siblings, number of sons, and total descendants.
- 📱 **Fully responsive & touch-friendly** — works on desktop and mobile.

## 🛠️ How it's built

| Layer | Choice | Why |
|-------|--------|-----|
| **Rendering** | Hand-rolled SVG layout engine | Full control over the tree layout algorithm; no heavy graph library |
| **Framework** | None — vanilla HTML/CSS/JS | Fast, dependency-free, loads instantly |
| **Data** | Single `data.js` file | Editing the whole genealogy is as simple as editing one array |
| **Hosting** | Cloudflare Workers (static assets) | Global edge delivery on a custom domain |
| **CI/CD** | GitHub Actions → `wrangler deploy` | Every merge ships to production automatically |

The layout logic lives in [`app.js`](app.js): it builds the tree from parent/child links, sizes each node, weights siblings around the starred ancestral line so it falls straight down the center, and renders everything as SVG with pan/zoom interaction.

## 🚀 From idea to production — the workflow

This project showcases a modern, fully-automated build-and-ship pipeline:

```
  🧠 Coded with Claude  →  🔀 Merged to GitHub  →  ☁️ Auto-deployed to Cloudflare
```

1. **Fully coded in Claude** — the entire application (layout engine, UI, styling, and this deployment pipeline) was written with Claude.
2. **Merged to GitHub** — changes land on the `main` branch through pull requests.
3. **Automatically deployed to Cloudflare** — a push to `main` triggers the [GitHub Actions workflow](.github/workflows/deploy.yml), which runs `wrangler deploy` to publish the site as a Cloudflare Worker with static assets. **[kairat.me](https://kairat.me)** updates within seconds — no manual steps.

> Full deployment and one-time setup details are in **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## 📂 Project structure

```
7-ata/
├── index.html                   # App shell & UI markup
├── styles.css                   # Styling (Kyrgyz ornament accents, responsive layout)
├── app.js                       # SVG tree layout engine + interactions
├── data.js                      # The genealogy data (edit here to update the tree)
├── wrangler.toml                # Cloudflare Worker configuration
├── DEPLOYMENT.md                # Deployment & setup guide
└── .github/workflows/deploy.yml # CI/CD: auto-deploy on merge to main
```

## 🧑‍💻 Run it locally

No build tools required — it's just static files:

```bash
# clone, then serve the folder with any static server
python3 -m http.server 8000
# open http://localhost:8000
```

## ➕ Updating the tree

To add or edit a person, change a single array in [`data.js`](data.js):

```js
{ id: "n236", parent: "n5", name: "Жаңы ат", star: true }
```

- `id` — unique identifier
- `parent` — the father's `id` (`null` for the root)
- `name` — the person's name
- `star` — `true` to mark the direct ancestral line
- `branch` — optional branch label used by the filter chips

Commit, merge to `main`, and the change is live automatically.

---

<p align="center"><sub>Built with ❤️ and Claude · Deployed on Cloudflare · <a href="https://kairat.me">kairat.me</a></sub></p>
