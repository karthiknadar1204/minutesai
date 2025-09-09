import { App } from '@slack/bolt'
import { authorizeSlack } from './utils/slack-auth'
import { handleMessage } from './handlers/message'
import { NextRequest, NextResponse } from 'next/server'
import { verifySlackSignature } from './utils/verifySlackSignature'
import { handleAppMention } from './handlers/app-mention'

const app = new App({
    signingSecret: process.env.SLACK_SIGNING_SECRET!,
    authorize: authorizeSlack
})

app.event('app_mention', handleAppMention)
app.message(handleMessage)

export async function POST(req: NextRequest) {
    try {
        const body = await req.text()
        const contentType = req.headers.get('content-type') || ''

        if (!body || body.trim().length === 0) {
            // Nothing to process; acknowledge to avoid Slack retries
            return NextResponse.json({ ok: true })
        }

        let bodyJson: any
        if (contentType.includes('application/json')) {
            bodyJson = JSON.parse(body)
        } else {
            // Handle urlencoded payloads (e.g., some Slack flows)
            const params = new URLSearchParams(body)
            const payload = params.get('payload')
            bodyJson = payload ? JSON.parse(payload) : Object.fromEntries(params)
        }

        if (bodyJson.type === 'url_verification') {
            return NextResponse.json({ challenge: bodyJson.challenge })
        }

        const signature = req.headers.get('x-slack-signature')
        const timestamp = req.headers.get('x-slack-request-timestamp')

        if (!signature || !timestamp) {
            return NextResponse.json({ error: 'missing signature' }, { status: 401 })
        }

        if (!verifySlackSignature(body, signature, timestamp)) {
            return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
        }

        await app.processEvent({
            body: bodyJson,
            ack: async () => { }
        })

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('POST error:', error)
        return NextResponse.json({ error: 'internal error' }, { status: 500 })
    }
}