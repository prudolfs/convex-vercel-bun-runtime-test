# AI Chat Smoke Test
## Convex + Bun + Elysia + Vercel Regression Test

## Goal

Build a minimal AI chat application whose primary purpose is **verifying that the Convex circular import issue is fixed** when deployed to **Vercel Bun Runtime**.

This is **not** a production application. The objective is to reproduce the architecture that previously failed while keeping the implementation as small as possible.

---

# Success Criteria

The project should successfully:

- run locally with Bun
- deploy to Vercel using Bun runtime
- import `ConvexHttpClient` from `convex/browser`
- use the shared `packages/convex` workspace package
- execute Convex queries and mutations from the Elysia server
- communicate between React → Elysia → Convex
- survive cold starts without module linking errors
- verify that previous runtime errors are no longer present

---

# Architecture

```
apps/
    web/
    server/

packages/
    convex/
```

```
React
    │
    ▼
HTTP
    │
    ▼
Elysia (Bun)
    │
    ▼
ConvexHttpClient
    │
    ▼
Convex Backend
```

---

# Technology

## Frontend

- React
- Vite
- TypeScript

## Backend

- Bun
- Elysia
- Vercel Functions

## Database

- Convex

## AI

- Vercel AI SDK
- Mock model (initially)
- Real provider can be added later

---

# Phase 1 — Project Setup ✅ DONE

## Objectives

Create the minimal project structure.

### Tasks

- Create monorepo
- Configure workspaces
- Configure TypeScript
- Configure shared package imports
- Configure environment variables
- Configure Bun
- Configure Vercel

### Deliverables

- project builds
- typecheck passes
- lint passes

---

# Phase 2 — Convex Package ✅ DONE

## Objectives

Create the shared Convex package.

### Schema

```
conversations

messages
```

### Message fields

- conversationId
- role
- content
- createdAt

### Queries

- listMessages(conversationId)

### Mutations

- createMessage()

### Deliverables

- generated Convex API
- exported package
- importable from web
- importable from server

---

# Phase 3 — Backend (Elysia) ✅ DONE

## Objectives

Create a minimal API server.

### Import

Use

```ts
import { ConvexHttpClient } from "convex/browser"
```

This is the primary import under test.

### Routes

```
GET /health

POST /chat

GET /messages
```

### Health

Returns

```
OK
```

Used to verify deployment.

### Chat Flow

Receive

```
{
    message: string
}
```

Then

1. save user message
2. generate assistant response
3. save assistant response
4. return assistant message

---

### Mock AI

Initially use

```
"You said: <message>"
```

No external LLM required.

The objective is testing Convex imports, not AI.

### Deliverables

- health endpoint
- chat endpoint
- Convex queries working
- Convex mutations working

---

# Phase 4 — Frontend

## Objectives

Create a tiny chat interface.

### Layout

```
+----------------------------+

Chat

-----------------------------

Hello

Hi there!

-----------------------------

[ message input         ]

[ Send ]

+----------------------------+
```

### Features

- load messages
- send message
- optimistic loading optional
- auto-scroll optional

No authentication.

No routing.

Single page only.

---

# Phase 5 — Integration

## Objectives

Verify communication across all layers.

### Flow

```
React

↓

POST /chat

↓

Elysia

↓

Convex mutation

↓

Mock AI

↓

Convex mutation

↓

React refreshes messages
```

### Verify

- messages persist
- reload keeps history
- multiple requests work

---

# Phase 6 — Deployment

## Objectives

Deploy to Vercel Bun Runtime.

### Requirements

Use Bun runtime.

Do **not** switch to Node.js.

The deployment must exercise the original failure path.

### Verify

- build succeeds
- deployment succeeds
- cold start succeeds
- health endpoint works
- chat endpoint works
- no module linking errors

---

# Phase 7 — Regression Testing

## Local

Verify

- project starts
- chat works
- Convex works

---

## Production

Deploy.

Test

- first request after deployment
- second request
- multiple sequential requests
- page refresh
- multiple chat messages

---

## Failure Conditions

The regression is considered **not fixed** if any of the following occur:

- `Requested module is not instantiated yet`
- module linking failures
- runtime crashes before handler execution
- Bun exits before request handling
- Convex import failures

---

# Stretch Goals

These are optional and should only be implemented after the regression test succeeds.

- streaming responses
- Vercel AI SDK streaming
- OpenAI-compatible provider
- conversation switching
- realtime updates
- React Query
- shared API client
- authentication

---

# Definition of Done

The project is complete when all of the following are true:

- ✅ Bun runtime is used on Vercel
- ✅ `ConvexHttpClient` is imported from `convex/browser`
- ✅ Shared `packages/convex` workspace is used
- ✅ React communicates with Elysia
- ✅ Elysia communicates with Convex
- ✅ Queries execute successfully
- ✅ Mutations execute successfully
- ✅ Chat messages persist
- ✅ Production deployment succeeds
- ✅ Cold starts succeed
- ✅ No `Requested module is not instantiated yet` errors occur
- ✅ No Bun module-linking failures occur