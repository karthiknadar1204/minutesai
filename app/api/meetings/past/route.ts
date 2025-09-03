import { db } from "@/lib/db";
import { meetings, users } from "@/database/models";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "not authed" }, { status: 401 })
        }
        const user = await db.select({
            id: users.id,
            calendarConnected: users.calendarConnected,
        })
        .from(users)
        .where(eq(users.clerkId, userId))
        .limit(1);

        if (!user.length) {
            // Return empty list instead of 404 to avoid client-side 404 noise pre-provisioning
            return NextResponse.json({ meetings: [] })
        }

        const pastMeetings = await db.select({
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
        .where(eq(meetings.meetingEnded, true))
        .orderBy(desc(meetings.endTime))
        .limit(10);

        return NextResponse.json({ meetings: pastMeetings })

    } catch (error) {
        return NextResponse.json({ error: 'failed to fetch past meetings', meetings: [] }, { status: 500 })
    }
}