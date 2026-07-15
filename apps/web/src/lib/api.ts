const API_BASE = '/api'

export type ChatMessage = {
	_id: string
	conversationId: string
	role: 'user' | 'assistant'
	content: string
	createdAt: number
}

export type ChatResponse = {
	conversationId: string
	role: 'assistant'
	content: string
}

export type ChatRequest = {
	message: string
	conversationId?: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`${API_BASE}${path}`, {
		...init,
		headers: {
			'content-type': 'application/json',
			...(init?.headers ?? {}),
		},
	})

	if (!response.ok) {
		const text = await response.text().catch(() => '')
		throw new Error(`Request failed: ${response.status} ${text}`)
	}

	return (await response.json()) as T
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
	if (!conversationId) return []
	return request<ChatMessage[]>(`/messages?conversationId=${encodeURIComponent(conversationId)}`)
}

export async function sendChat(body: ChatRequest): Promise<ChatResponse> {
	return request<ChatResponse>('/chat', {
		method: 'POST',
		body: JSON.stringify(body),
	})
}
