import { db } from "@/lib/db";
import { users } from "@/database/models";
import { eq, and, isNotNull } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "not authed" }, { status: 401 })
        }

        const userResult = await db.select()
            .from(users)
            .where(eq(users.clerkId, userId))
            .limit(1)

        if (!userResult.length) {
            return NextResponse.json({ error: "user not found" }, { status: 404 })
        }

        const user = userResult[0]
        
        if (!user.googleAccessToken) {
            return NextResponse.json({ error: "no google access token" }, { status: 400 })
        }

        const now = new Date()
        const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
            `timeMin=${now.toISOString()}&` +
            `timeMax=${sevenDays.toISOString()}&` +
            `singleEvents=true&orderBy=startTime&showDeleted=true`,
            {
                headers: {
                    'Authorization': `Bearer ${user.googleAccessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        )

        if (!response.ok) {
            return NextResponse.json({ 
                error: `Calendar API failed: ${response.status}`,
                status: response.status 
            }, { status: response.status })
        }

        const data = await response.json()
        const events = data.items || []

        // Debug: Show first few events with their meeting link data
        const debugEvents = events.slice(0, 5).map((event: any) => ({
            id: event.id,
            summary: event.summary,
            start: event.start,
            hangoutLink: event.hangoutLink,
            conferenceData: event.conferenceData,
            meetingUrl: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri,
            hasMeetingUrl: !!(event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri)
        }))

        return NextResponse.json({
            totalEvents: events.length,
            eventsWithMeetingLinks: events.filter((e: any) => 
                e.hangoutLink || e.conferenceData?.entryPoints?.[0]?.uri
            ).length,
            debugEvents,
            allEvents: events.map((event: any) => ({
                id: event.id,
                summary: event.summary,
                start: event.start,
                hangoutLink: event.hangoutLink,
                conferenceData: event.conferenceData
            }))
        })

    } catch (error) {
        console.error('debug calendar error:', error)
        return NextResponse.json({ 
            error: 'internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
