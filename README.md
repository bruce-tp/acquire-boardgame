# Acquire Board Game

Classic Acquire for 2–6 friends, with Hong Kong and Japanese hotel artwork.

遊戲網址 / Play: https://acquire-boardgame.pages.dev

## Build and checks

```sh
npm ci --include=dev --include=optional
npm run check
npm test
npm run build:cloudflare
ACQUIRE_API_WORKER=outputs/cloudflare-pages/_worker.js node tests/api.test.mjs
```

Only the game, public artwork, Cloudflare adapter and tests are included.

## Automatic deployment

Pushes to main run checks and deploy to the existing Cloudflare Pages project acquire-boardgame. Configure CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in repository Settings > Secrets and variables > Actions. The API token needs Account / Cloudflare Pages / Edit permission scoped to the owner’s account. Never commit the token.

The existing production D1 binding must remain DB → acquire-rooms. Deployments do not recreate the database or run schema migrations.

Only changes pushed to this repository trigger its workflow.
