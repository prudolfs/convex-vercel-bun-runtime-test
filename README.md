# Convex + Bun + Elysia on Vercel — Runtime Regression Test

A tiny AI-chat app whose only job is to prove that **Convex works inside the Vercel Bun runtime**.

**The bug.** On Vercel Bun (public beta), `import { ConvexHttpClient } from "convex/browser"` crashed during module linking, before the handler ever ran:

```
TypeError: Requested module is not instantiated yet.
    at link (native:1:11)
Bun process exited with exit status: 1
```

The root cause was a circular import inside the `convex` package: `convex/browser` resolved to a barrel that imported from `index.js`, and `index.js` re-exported the same module. Node and local Bun tolerated it; Vercel Bun's module loader did not.

**The fix.** Convex removed the circular import in [`convex@1.42.2`](https://www.npmjs.com/package/convex). This repo pins that version and reproduces the exact failing architecture to confirm the crash is gone.

---

## What is being tested

That these still work **together, in production, on Vercel's Bun runtime**:

- `import { ConvexHttpClient } from "convex/browser"` — the exact import that used to break
- A shared `packages/convex` workspace package (schema, queries, mutations)
- An Elysia server exporting a `fetch` handler
- Cold starts without module-linking errors
- Real Convex reads and writes from inside the serverless function

The "AI" is just an echo (`You said: <message>`). No LLM is involved — AI is not the point.

---

## Architecture

```
React (apps/web)
   │  HTTP
   ▼
Elysia · Bun (apps/server)   ←  imports convex/browser
   │  ConvexHttpClient
   ▼
Convex backend (packages/convex)
```

```
apps/
  web/      React + Vite chat UI
  server/   Elysia app, deployed as a Vercel Bun function
packages/
  convex/   shared Convex schema + query/mutation API
```

---

## Result

Deployed at **https://server-ecru-iota-97.vercel.app/** — all green:

| Check | Status |
| --- | --- |
| Build + deploy on Bun runtime | ✅ |
| `GET /health` and `/api/health` → `OK` | ✅ |
| `POST /api/chat` → saves to Convex, returns reply | ✅ |
| `GET /api/messages` → persisted history, survives reload | ✅ |
| Multiple sequential requests | ✅ |
| No `Requested module is not instantiated yet` errors | ✅ |

See [`docs/smoke-test.md`](docs/smoke-test.md) for the full phase-by-phase test plan.

---

## Run it locally

Requirements: [Bun](https://bun.sh) 1.x and a Convex deployment.

```bash
bun install

# 1. Start the Convex backend
bun run convex:dev

# 2. Set the Convex URL for the server (get it from packages/convex/.env.local)
cp apps/server/.env.example apps/server/.env.local
#   then fill in CONVEX_URL

# 3. Start server + web together
bun run dev
```

- Web: http://localhost:5173
- Server: http://localhost:3001

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Quick "is it up" check |
| GET | `/api/health` | Same, under the API prefix |
| POST | `/api/chat` | Body `{ message, conversationId? }` → echoes back and persists |
| GET | `/api/messages?conversationId=` | List messages for a conversation |

---

## Deploy

The **server** is a Vercel project linked to `apps/server`. On push to `main`, Vercel auto-deploys it as a Bun function (`bunVersion` in `apps/server/vercel.json`, zero-config Bun detection). The environment variable `CONVEX_URL` is set in the Vercel dashboard.

The **web app** is not part of the Vercel deploy — run it locally or host it anywhere you like.

---

## Scripts

```bash
bun run dev          # start server + web
bun run typecheck    # tsc --noEmit across all workspaces
bun run lint         # biome lint
bun run convex:dev   # run the Convex backend locally
bun run convex:deploy # deploy Convex functions
```

## Tech

React · Vite · TypeScript · Bun · Elysia · Vercel Functions (Bun runtime) · Convex
