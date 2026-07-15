import { ConvexHttpClient } from 'convex/browser'
import type { Id } from '@convex-vercel-bun-runtime-test/convex/dataModel'
import { api } from '@convex-vercel-bun-runtime-test/convex/api'
import { Elysia, t } from 'elysia'

const CONVEX_URL = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL

if (!CONVEX_URL) {
	console.error('CONVEX_URL environment variable is required')
}

// Primary import under test: `convex/browser` -> ConvexHttpClient.
// A fresh client per request keeps the mutation queue isolated across
// serverless invocations. Mutations use skipQueue to run immediately.
async function withClient<T>(fn: (client: ConvexHttpClient) => Promise<T>): Promise<T> {
	if (!CONVEX_URL) {
		throw new Error('CONVEX_URL is not configured')
	}
	const client = new ConvexHttpClient(CONVEX_URL, {
		skipConvexDeploymentUrlCheck: true,
		logger: false,
	})
	return await fn(client)
}

export type ChatResponse = {
	conversationId: string
	role: 'assistant'
	content: string
}

export type Message = {
	_id: string
	conversationId: string
	role: 'user' | 'assistant'
	content: string
	createdAt: number
}

// Mock AI: echo the user's message back. No external LLM required —
// the objective of this smoke test is the Convex import/load path, not AI.
function generateAssistantResponse(message: string): string {
	return `You said: ${message}`
}

// The Elysia app instance is shared between the local dev server (Bun
// auto-serve) and the Vercel Bun serverless function entry.
export const app = new Elysia()

app.get('/api/health', () => 'OK')

app.post(
	'/api/chat',
	async ({ body, set }) => {
		const { message, conversationId: incomingId } = body

		const result = await withClient(async (client): Promise<ChatResponse> => {
			// Ensure we have a conversation to attach messages to.
			let conversationId: Id<'conversations'> | undefined = incomingId
				? (incomingId as Id<'conversations'>)
				: undefined
			if (!conversationId) {
				conversationId = await client.mutation(api.conversations.create, {})
			}

			// 1. save user message
			await client.mutation(
				api.messages.createMessage,
				{ conversationId, role: 'user', content: message },
				{ skipQueue: true },
			)

			// 2. generate assistant response (mock)
			const assistantContent = generateAssistantResponse(message)

			// 3. save assistant response
			await client.mutation(
				api.messages.createMessage,
				{ conversationId, role: 'assistant', content: assistantContent },
				{ skipQueue: true },
			)

			// 4. return assistant message
			return { conversationId, role: 'assistant', content: assistantContent }
		})

		set.headers['content-type'] = 'application/json'
		return result
	},
	{
		body: t.Object({
			message: t.String(),
			conversationId: t.Optional(t.String()),
		}),
	},
)

app.get('/api/messages', async ({ query, set }) => {
	const conversationId = query.conversationId as Id<'conversations'> | undefined

	const result = await withClient(async (client): Promise<Message[]> => {
		if (!conversationId) {
			// No conversation yet — nothing to show.
			return []
		}
		return await client.query(api.messages.listMessages, { conversationId })
	})

	set.headers['content-type'] = 'application/json'
	return result
})

// Root health check for direct deployment verification (e.g. curl root).
app.get('/health', () => 'OK')

// Vercel Bun serverless function entry. The `@vercel/backends` rolldown
// backend selects `src/app.ts` as the root entrypoint; its default export must
// be a function or a server-like object. An Elysia instance qualifies (it has
// a `fetch` method), so exporting the `app` instance satisfies both the local
// Bun dev server (which imports `app` from here) and the Vercel function.
export default app
