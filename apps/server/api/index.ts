import { app } from '../src/app'

// Vercel Bun runtime entry. The runtime rebuilds this file from source and
// invokes the exported `fetch` for every request. `rewrites` in `vercel.json`
// route `/(.*)` here so Elysia's internal routing (`/api/health`, `/api/chat`,
// `/api/messages`, `/health`) handles dispatch.
export const fetch = app.fetch

export default app
