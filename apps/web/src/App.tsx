import { Send } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { type ChatMessage, getMessages, sendChat } from '@/lib/api'

const CONVERSATION_KEY = 'smoke.conversationId'

export default function App() {
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [input, setInput] = useState('')
	const [sending, setSending] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [conversationId, setConversationId] = useState<string>(() => {
		return localStorage.getItem(CONVERSATION_KEY) ?? ''
	})

	const scrollRef = useRef<HTMLDivElement>(null)

	// Load messages on mount / when conversationId changes.
	useEffect(() => {
		if (!conversationId) return
		let cancelled = false
		getMessages(conversationId)
			.then((result) => {
				if (!cancelled) {
					setMessages(result)
					setError(null)
				}
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : 'Failed to load messages')
				}
			})
		return () => {
			cancelled = true
		}
	}, [conversationId])

	// Auto-scroll to the latest message.
	useEffect(() => {
		scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
	}, [])

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const message = input.trim()
		if (!message || sending) return

		setSending(true)
		setError(null)

		// Optimistic: show the user message immediately.
		const optimistic: ChatMessage = {
			_id: `optimistic-${Date.now()}`,
			conversationId,
			role: 'user',
			content: message,
			createdAt: Date.now(),
		}
		setMessages((prev) => [...prev, optimistic])
		setInput('')

		try {
			const response = await sendChat({ message, conversationId: conversationId || undefined })

			if (!conversationId) {
				localStorage.setItem(CONVERSATION_KEY, response.conversationId)
				setConversationId(response.conversationId)
			}

			setMessages((prev) => [
				...prev.filter((m) => m._id !== optimistic._id),
				{
					_id: `optimistic-assistant-${Date.now()}`,
					conversationId: response.conversationId,
					role: 'assistant',
					content: response.content,
					createdAt: Date.now() + 1,
				},
			])

			// Refresh from server to reconcile the persisted messages.
			const fresh = await getMessages(response.conversationId)
			setMessages(fresh)
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : 'Failed to send message')
			// Roll back the optimistic user message on failure.
			setMessages((prev) => prev.filter((m) => m._id !== optimistic._id))
		} finally {
			setSending(false)
		}
	}

	return (
		<div className="min-h-svh bg-muted/30">
			<main className="mx-auto flex min-h-svh max-w-2xl flex-col p-4 sm:p-6">
				<Card className="flex min-h-0 flex-1 flex-col">
					<CardHeader>
						<CardTitle>Chat</CardTitle>
					</CardHeader>
					<CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-0">
						<div
							ref={scrollRef}
							className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 pb-4"
						>
							{messages.length === 0 ? (
								<p className="py-12 text-center text-muted-foreground text-sm">
									No messages yet. Say hello.
								</p>
							) : (
								messages.map((message) => (
									<Bubble key={message._id} role={message.role} content={message.content} />
								))
							)}
						</div>

						{error ? <p className="px-6 pb-2 text-destructive text-sm">{error}</p> : null}

						<form onSubmit={handleSubmit} className="flex gap-2 px-6 pb-6">
							<Input
								value={input}
								onChange={(event) => setInput(event.target.value)}
								placeholder="Message"
								disabled={sending}
								autoFocus
							/>
							<Button type="submit" size="icon" disabled={sending} aria-label="Send">
								<Send className="h-4 w-4" />
							</Button>
						</form>
					</CardContent>
				</Card>
			</main>
		</div>
	)
}

function Bubble({ role, content }: { role: 'user' | 'assistant'; content: string }) {
	const isUser = role === 'user'
	return (
		<div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
			<div
				className={
					isUser
						? 'max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground text-sm'
						: 'max-w-[80%] rounded-2xl rounded-bl-sm border bg-card px-3 py-2 text-sm shadow-sm'
				}
			>
				{content}
			</div>
		</div>
	)
}
