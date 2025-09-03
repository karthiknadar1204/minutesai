import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.redirect('/sign-in')
        }

        const state = Buffer.from(JSON.stringify({ userId })).toString('base64')

        const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
        const clientId = process.env.GOOGLE_CLIENT_ID!
        const redirectUri = process.env.GOOGLE_REDIRECT_URI!

        if (!clientId || !redirectUri) {
            console.error('Missing GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI in environment')
            return NextResponse.json({ error: 'Server misconfigured: missing Google OAuth env vars' }, { status: 500 })
        }

        googleAuthUrl.searchParams.set('client_id', clientId)
        googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
        googleAuthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/calendar.readonly')
        googleAuthUrl.searchParams.set('response_type', 'code')
        googleAuthUrl.searchParams.set('access_type', 'offline')
        googleAuthUrl.searchParams.set('prompt', 'consent')
        googleAuthUrl.searchParams.set('state', state)

        console.log('Google OAuth redirect_uri:', redirectUri)
        console.log('Google OAuth auth URL:', googleAuthUrl.toString())

        return NextResponse.redirect(googleAuthUrl.toString())
    } catch (error) {
        console.error('Direct OAuth error:', error)
        return NextResponse.json({ error: "Failed to setup OAuth" }, { status: 500 })
    }
}