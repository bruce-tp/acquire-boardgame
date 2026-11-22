# Acquire on Cloudflare Pages + D1

This deployment reuses the exact React game screen and Classic engine from the hosted Site. Only the hosting adapter changes. It has no ChatGPT sign-in dependency.

## Build

Run `npm run build:cloudflare`. Upload the **contents** of `outputs/cloudflare-pages` as a ZIP or folder in a Cloudflare **Pages Direct Upload** project (not an assets-only Worker). `_worker.js` must be at the archive root alongside `index.html` and `_routes.json`.

The Pages URL will differ from the existing Hello World Worker URL. The original Site remains available. Existing rooms stay on the original Site; create new rooms on the new URL.

## Database

Create a D1 database named `acquire-rooms` and run `deploy/cloudflare/schema.sql` in its console. In the Pages project's production and preview bindings, bind that database with the exact variable name `DB`. Redeploy the ZIP after changing bindings. Keep the free Workers plan. No R2 bucket, paid add-on or custom domain is required by this application.

`/api/health` must return HTTP 200 with `{"ok":true,"storage":"D1"}` before online play is ready. Without the database binding or table it returns HTTP 503. Practice mode runs locally without D1.

## Checks

Run `npx tsc --noEmit`, then `ACQUIRE_API_WORKER=outputs/cloudflare-pages/_worker.js node tests/api.test.mjs`. This uses the actual bundled Worker and verifies room persistence, hidden cash/shares/hands, host-only start, late-join rules, stale action rejection, concurrent state updates and rejoining.

`_routes.json` invokes the Worker only on `/api/*`; HTML, scripts, styles and illustrations are served as static assets. Current online synchronisation polls every 1.6 seconds, including while the tab is in the background. Six clients open for three hours therefore use about 40,500 polling requests, plus actions and other traffic.

After publication, verify both the Pages URL and online room play from the intended Hong Kong connections without a VPN. The earlier Hello World test only verified the workers.dev test URL from that visitor's connection.

## Automatic updates with GitHub Actions

The workflow `.github/workflows/cloudflare-pages.yml` updates the existing `acquire-boardgame` project on pushes to `main` or a manual workflow run. The URL and existing production D1 binding are retained. It does not create a database, run schema changes, or copy game rooms.

One-time setup in the owner's own signed-in browsers:

1. Put the source in a private GitHub repository. Keep the current lockfile and the workflow file.
2. In Cloudflare, create an API token restricted to the selected account with **Account / Cloudflare Pages / Edit** only. The account ID is already visible in the account dashboard.
3. In GitHub repository **Settings > Secrets and variables > Actions**, add `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`. Enter the token only in the GitHub secret field, never in source files or chat.
4. Run **Actions > Deploy Acquire to Cloudflare Pages > Run workflow** once. Confirm all checks, deployment and the live D1 health check succeed.
5. Later approved pushes to `main` build and deploy automatically. Future code changes must be pushed to this GitHub repository; changing only the original ChatGPT Site source will not trigger GitHub Actions.

GitHub Actions has plan-specific usage limits. Use standard Ubuntu runners and review the account's current billing and budget settings before enabling paid usage. This workflow stores no build artifacts and uses the npm cache through setup-node.
