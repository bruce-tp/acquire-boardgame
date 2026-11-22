# Big Ambition

A hotel investment game for 2–6 friends, with Hong Kong and Japanese hotel artwork.

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

## Purchase announcements

A confirmed basket announces every hotel, quantity and line cost, plus total spending. Finishing without buying announces zero shares. Each authenticated seat receives a separate 15-second display window; receipts use namespaced auxiliary rows in the existing rooms table and do not change the game version. The server keeps a five-minute bounded delivery buffer for delayed polls. Expired receipts cannot be replayed by refreshing or rejoining the same seat. Live details are excluded from permanent public history; cash and cumulative holdings remain private. No schema migration or additional service is required.

## Room rules and bonuses

New rooms use Classic with Standard bonuses (10× majority, 5× minority) by default. Hosts may instead choose Custom with majority 5×, 7× or 10× and minority at half. The setting is fixed when the room is created, shared with all players and used for mergers, final settlement and price references. Unsplit custom awards are exact; tied splits round up to $100. Existing rooms without settings continue as Standard. No database migration is required.
