# Automatic Deployment to Cloudflare Pages

This repository is set up to automatically deploy to Cloudflare Pages every time
something is merged (pushed) to the `main` branch, using the GitHub Actions
workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

> **Why GitHub Actions instead of Cloudflare's built-in Git integration?**
> A Pages project created via manual upload ("Direct Upload") cannot be
> converted to a Git-connected project in the Cloudflare dashboard. Deploying
> with Wrangler from GitHub Actions works with your **existing** project, so
> you keep your current project, custom domain, and settings — nothing needs
> to be recreated.

## One-time setup

### Step 1 — Find your Cloudflare Account ID

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com/).
2. Open **Workers & Pages** (or any domain overview page).
3. Copy the **Account ID** shown in the right-hand sidebar
   (it's a 32-character hex string).

### Step 2 — Find your Pages project name

1. In the Cloudflare dashboard, go to **Workers & Pages**.
2. Find the Pages project you currently upload files to manually.
3. Note its exact **project name** (the name shown in the list, also part of
   the `*.pages.dev` URL, e.g. `my-site` for `my-site.pages.dev`).

### Step 3 — Create a Cloudflare API token

1. In the Cloudflare dashboard, click your profile icon (top right) →
   **My Profile** → **API Tokens** (or go directly to
   <https://dash.cloudflare.com/profile/api-tokens>).
2. Click **Create Token**.
3. Choose **Create Custom Token** and configure it:
   - **Token name:** `github-actions-pages-deploy` (any name works)
   - **Permissions:** `Account` → `Cloudflare Pages` → `Edit`
   - **Account Resources:** `Include` → your account
4. Click **Continue to summary** → **Create Token**.
5. **Copy the token immediately** — it is shown only once.

### Step 4 — Add the secrets to your GitHub repository

1. Open this repository on GitHub → **Settings** → **Secrets and variables** →
   **Actions**.
2. Click **New repository secret** and create these three secrets:

   | Secret name               | Value                              |
   |---------------------------|------------------------------------|
   | `CLOUDFLARE_API_TOKEN`    | The API token from Step 3          |
   | `CLOUDFLARE_ACCOUNT_ID`   | The Account ID from Step 1         |
   | `CLOUDFLARE_PROJECT_NAME` | The Pages project name from Step 2 |

### Step 5 — Merge this branch and verify

1. Merge the branch containing the workflow file into `main`.
2. Go to the repository's **Actions** tab — a run named
   **"Deploy to Cloudflare Pages"** should start automatically.
3. When it finishes green, check your site: the new deployment appears in
   **Workers & Pages → your project → Deployments**, and your custom domain
   serves the updated files.

## How it works after setup

- **Every push/merge to `main`** triggers the workflow, which uploads the
  site files (`index.html`, `app.js`, `data.js`, `styles.css`, and anything
  else you add) to your existing Pages project as a new production deployment.
- **Manual deploys:** you can also trigger a deploy by hand from the
  **Actions** tab → "Deploy to Cloudflare Pages" → **Run workflow**
  (the workflow includes a `workflow_dispatch` trigger).
- **Adding new files:** no changes needed — the workflow uploads the whole
  repository except `.git`, `.github`, `README.md`, and `DEPLOYMENT.md`.
  If you want to exclude other files from the deployed site, add them to the
  `--exclude` list in `.github/workflows/deploy.yml`.

## Troubleshooting

- **`Authentication error [code: 10000]`** — the API token is wrong, expired,
  or missing the `Cloudflare Pages: Edit` permission. Recreate it (Step 3)
  and update the `CLOUDFLARE_API_TOKEN` secret.
- **`Project not found`** — `CLOUDFLARE_PROJECT_NAME` doesn't match the exact
  project name in the dashboard, or `CLOUDFLARE_ACCOUNT_ID` points at a
  different account.
- **Workflow doesn't start on merge** — make sure the workflow file exists on
  `main` (it only triggers once it has been merged there) and that Actions
  are enabled under **Settings → Actions → General**.
- **Old content still showing on your domain** — check
  **Workers & Pages → your project → Deployments** to confirm the new
  deployment is the active production one; if it is, it's usually browser or
  Cloudflare cache — try a hard refresh or **Caching → Purge Cache** for the
  domain.
