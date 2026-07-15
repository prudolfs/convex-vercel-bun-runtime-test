import { app } from './app'

// Local dev entry. Run with `bun src/index.ts` (or `bun run dev`).
// Bun auto-serves this default object on the given port.
export default {
	port: Number(process.env.PORT ?? 3001),
	fetch: app.fetch,
}
