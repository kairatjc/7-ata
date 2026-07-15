# Automatic Deployment to Cloudflare

This repository automatically deploys to the Cloudflare Worker **`sample`**
(the one serving `kairat.me`) every time something is merged (pushed) to the
`main` branch, using the GitHub Actions workflow in
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

The site is hosted as a **Worker with static assets** (not a Cloudflare Pages
project), so the workflow runs `wrangler deploy` with the configuration in
[`wrangler.toml`](wrangler.toml). The worker name, custom domain, and asset
settings all live in that file:

- `name = "sample"` — must match the worker name in the Cloudflare dashboard
  (it's the part before `.kairatjc.workers.dev`).
- `[[routes]]` with `pattern = "kairat.me"` — keeps the custom domain attached
  across deploys.
- `[assets] directory = "./dist"` — the workflow collects the site files into
  `dist/` before deploying.

## One-time setup

### Step 1 — Find your Cloudflare Account ID

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/).
2. Open **Workers & Pages** (or any domain overview page).
3. Copy the **Account ID** shown in the right-hand sidebar
   (it's a 32-character hex string).

### Step 2 — Create a Cloudflare API token

1. In the Cloudflare dashboard, click your profile icon (top right) →
   **My Profile** → **API Tokens** (or go directly to
   <https://dash.cloudflare.com/profile/api-tokens>).
2. Click **Create Token**.
3. Use the **Edit Cloudflare Workers** template — it includes all the
   permissions Wrangler needs (Workers Scripts edit + Workers Routes edit for
   the custom domain).
4. Under **Account Resources**, include your account; under **Zone
   Resources**, include the `kairat.me` zone (or all zones).
5. Click **Continue to summary** → **Create Token**.
6. **Copy the token immediately** — it is shown only once.

### Step 3 — Add the secrets to your GitHub repository

1. Open this repository on GitHub → **Settings** → **Secrets and variables** →
   **Actions**.
2. Click **New repository secret** and create these two secrets:

   | Secret name             | Value                      |
   |-------------------------|----------------------------|
   | `CLOUDFLARE_API_TOKEN`  | The API token from Step 2  |
   | `CLOUDFLARE_ACCOUNT_ID` | The Account ID from Step 1 |

### Step 4 — Merge this branch and verify

1. Merge the pull request containing the workflow into `main`.
2. Go to the repository's **Actions** tab — a run named
   **"Deploy to Cloudflare"** should start automatically.
3. When it finishes green, check **Workers & Pages → sample → Versions** in
   the Cloudflare dashboard: a new version should appear (deployed via API
   instead of "Manually deployed"), and <https://kairat.me> should serve the
   updated files.

## How it works after setup

- **Every push/merge to `main`** triggers the workflow, which uploads the
  site files (`index.html`, `app.js`, `data.js`, `styles.css`, and anything
  else you add) as the worker's static assets in a new version.
- **Manual deploys:** you can also trigger a deploy by hand from the
  **Actions** tab → "Deploy to Cloudflare" → **Run workflow** (the workflow
  includes a `workflow_dispatch` trigger), or keep using the dashboard upload
  — the next merge to `main` simply deploys a newer version on top.
- **Adding new files:** no changes needed — the workflow uploads the whole
  repository except `.git`, `.github`, `README.md`, `DEPLOYMENT.md`, and
  `wrangler.toml`. To exclude other files from the deployed site, add them to
  the `--exclude` list in `.github/workflows/deploy.yml`.

## Troubleshooting

- **`Authentication error [code: 10000]`** — the API token is wrong, expired,
  or missing permissions. Recreate it with the **Edit Cloudflare Workers**
  template (Step 2) and update the `CLOUDFLARE_API_TOKEN` secret.
- **Errors about routes or custom domains** — the token's **Zone Resources**
  don't include `kairat.me`, or the `pattern` in `wrangler.toml` doesn't match
  the domain configured in the dashboard.
- **A brand-new worker appeared instead of updating `sample`** — the `name`
  in `wrangler.toml` doesn't exactly match the existing worker's name. Fix the
  name, redeploy, and delete the accidental worker in the dashboard.
- **Workflow doesn't start on merge** — make sure the workflow file exists on
  `main` (it only triggers once it has been merged there) and that Actions
  are enabled under **Settings → Actions → General**.
- **Old content still showing on kairat.me** — confirm the new version is
  active under **Workers & Pages → sample → Versions**; if it is, it's
  usually browser or Cloudflare cache — try a hard refresh or
  **Caching → Purge Cache** for the domain.
