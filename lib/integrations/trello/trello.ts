import { ActionItemData } from "@/lib/types"

export class TrelloAPI {
    private apiKey = process.env.TRELLO_API_KEY!

    private baseUrl = 'https://api.trello.com/1'

    async getBoards(token: string) {
        const response = await fetch(
            `${this.baseUrl}/members/me/boards?key=${this.apiKey}&token=${token}`
        )

        if (!response.ok) {
            throw new Error('failed to fetch boards')
        }

        return response.json()
    }

    async createBoard(token: string, name: string) {
        const response = await fetch(
            `${this.baseUrl}/boards?key=${this.apiKey}&token=${token}&name=${encodeURIComponent(name)}&defaultLists=true`,
            { method: 'POST' }

        )

        if (!response.ok) {
            throw new Error('failed to create boards')
        }

        return response.json()
    }

    async getBoardLists(token: string, boardId: string) {
        const response = await fetch(
            `${this.baseUrl}/boards/${boardId}/lists?key=${this.apiKey}&token=${token}`
        )

        if (!response.ok) {
            throw new Error('failed to fetch lists')
        }

        return response.json()
    }
    async createCard(token: string, listId: string, data: ActionItemData) {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)
        try {
            const body = new URLSearchParams({
                key: this.apiKey,
                token,
                idList: listId,
                name: data.title,
                desc: data.description || ''
            })

            const response = await fetch(
                `${this.baseUrl}/cards`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    },
                    body,
                    signal: controller.signal
                }
            )

            if (!response.ok) {
                let detail = ''
                try { detail = await response.text() } catch {}
                throw new Error(`failed to create card: ${response.status} ${detail}`)
            }

            return response.json()
        } catch (err: any) {
            if (err?.name === 'AbortError') {
                throw new Error('Trello API request timed out. Please try again.')
            }
            throw err
        } finally {
            clearTimeout(timeout)
        }
    }
}