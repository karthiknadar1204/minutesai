import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { meetings, users } from "@/database/models";
import { eq, asc, gte } from "drizzle-orm";
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }

        const user = await db.select({
            id: users.id,
            calendarConnected: users.calendarConnected,
        })
        .from(users)
        .where(eq(users.clerkId, userId))
        .limit(1);

        if (!user.length) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const now = new Date()
        const upcomingMeetings = await db.select({
            id: meetings.id,
            calendarEventId: meetings.calendarEventId,
            title: meetings.title,
            startTime: meetings.startTime,
            endTime: meetings.endTime,
            attendees: meetings.attendees,
            meetingUrl: meetings.meetingUrl,
            botScheduled: meetings.botScheduled,
        })
        .from(meetings)
        .where(eq(meetings.userId, user[0].id))
        .where(gte(meetings.startTime, now))
        .where(eq(meetings.isFromCalendar, true))
        .orderBy(asc(meetings.startTime))
        .limit(10);

        const parseAttendees = (value: any): string[] => {
            if (!value) return []
            try {
                if (Array.isArray(value)) {
                    return value.map((v) => String(v).trim()).filter(Boolean)
                }
                if (typeof value === 'string') {
                    try {
                        const parsed = JSON.parse(value)
                        if (Array.isArray(parsed)) {
                            return parsed.map((v: any) => String(v).trim()).filter(Boolean)
                        }
                        return String(parsed).split(',').map((v) => v.trim()).filter(Boolean)
                    } catch {
                        return value.split(',').map((v) => v.trim()).filter(Boolean)
                    }
                }
                // For objects or other types, best-effort stringify
                return String(value).split(',').map((v) => v.trim()).filter(Boolean)
            } catch {
                return []
            }
        }

        const events = upcomingMeetings.map(meeting => ({
            id: meeting.calendarEventId || meeting.id,
            summary: meeting.title,
            start: { dateTime: meeting.startTime.toISOString() },
            end: { dateTime: meeting.endTime.toISOString() },
            attendees: parseAttendees(meeting.attendees),
            hangoutLink: meeting.meetingUrl,
            conferenceData: meeting.meetingUrl ? { entryPoints: [{ uri: meeting.meetingUrl }] } : null,
            botScheduled: meeting.botScheduled,
            meetingId: meeting.id
        }))

        return NextResponse.json({
            events,
            connected: user[0].calendarConnected,
            source: 'database'
        })

    } catch (error) {
        console.error('Error fetching meetings:', error)
        return NextResponse.json({
            error: "Failed to fetch meetings",
            events: [],
            connected: false
        }, { status: 500 })
    }
}