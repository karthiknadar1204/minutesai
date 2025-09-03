import { db } from "@/lib/db"
import { users } from "@/database/models";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    try {
        const url = new URL(request.url)
        const code = url.searchParams.get('code')
        const state = url.searchParams.get('state')
        const error = url.searchParams.get('error')

        if (error) {
            console.error('oauth error', error)
            return NextResponse.redirect(new URL('/home?error=oauth_denied', request.url))
        }

        if (!code || !state) {
            console.error('missing code or state ')
            return NextResponse.redirect(new URL('/home?error=oauth_failed', request.url))
        }

        const { userId } = JSON.parse(Buffer.from(state, 'base64').toString())
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: process.env.GOOGLE_REDIRECT_URI!
            })
        })

        const tokens = await tokenResponse.json()

        if (!tokens.access_token) {
            console.error('no access token received', tokens)
            return NextResponse.redirect(new URL('/home?error=no_access_token', request.url))
        }

        const user = await db.select({
            id: users.id,
        })
        .from(users)
        .where(eq(users.clerkId, userId))
        .limit(1);

        if (!user.length) {
            console.error('user not found', userId)
            return NextResponse.redirect(new URL('/home?error=user_not_found', request.url))
        }

        await db.update(users)
        .set({
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token,
            calendarConnected: true,
            googleTokenExpiry: new Date(Date.now() + (tokens.expires_in * 1000))
        })
        .where(eq(users.clerkId, userId));

        return NextResponse.redirect(new URL('/home?connected=direct', request.url))
    } catch (error) {
        console.error('callback error: ', error)
        return NextResponse.redirect(new URL('/home?error=callback_failed', request.url))
    }
}
