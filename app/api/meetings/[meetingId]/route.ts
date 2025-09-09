import { db } from "@/lib/db";
import { meetings, users } from "@/database/models";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
) {
    try {
        const { userId: clerkUserId } = await auth()

        const { meetingId } = await params

        const meeting = await db
            .select({
                id: meetings.id,
                calendarEventId: meetings.calendarEventId,
                title: meetings.title,
                startTime: meetings.startTime,
                endTime: meetings.endTime,
                attendees: meetings.attendees,
                meetingUrl: meetings.meetingUrl,
                botScheduled: meetings.botScheduled,
                summary: meetings.summary,
                processed: meetings.processed,
                transcript: meetings.transcript,
                actionItems: meetings.actionItems,
                recordingUrl: meetings.recordingUrl,
                userId: meetings.userId,
                user: users,
            })
            .from(meetings)
            .leftJoin(users, eq(users.id, meetings.userId))
            .where(eq(meetings.id, meetingId))
            .limit(1);

        if (!meeting[0]) {
            return NextResponse.json({ error: 'meeting not found' }, { status: 404 })
        }

        const responseData = {
            ...meeting[0],
            isOwner: clerkUserId === meeting[0].user?.clerkId,
        }

        return NextResponse.json(responseData)
    } catch (error) {
        console.error('api error:', error)
        return NextResponse.json({ error: 'failed to fetch meeting' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
        }

        const { meetingId } = await params

        const meeting = await db
            .select({
                id: meetings.id,
                calendarEventId: meetings.calendarEventId,
                title: meetings.title,
                startTime: meetings.startTime,
                endTime: meetings.endTime,
                attendees: meetings.attendees,
                meetingUrl: meetings.meetingUrl,
                botScheduled: meetings.botScheduled,
                summary: meetings.summary,
                processed: meetings.processed,
                transcript: meetings.transcript,
                actionItems: meetings.actionItems,
                recordingUrl: meetings.recordingUrl,
                userId: meetings.userId,
                user: users,
            })
            .from(meetings)
            .leftJoin(users, eq(users.id, meetings.userId))
            .where(eq(meetings.id, meetingId))
            .limit(1);

        if (!meeting[0]) {
            return NextResponse.json({ error: 'meeting not found' }, { status: 404 })
        }

        if (meeting[0].user?.clerkId !== userId) {
            return NextResponse.json({ error: 'not authorized to delete this meeting' }, { status: 403 })
        }

        await db.delete(meetings).where(eq(meetings.id, meetingId))

        return NextResponse.json({
            success: true,
            message: 'meeting deleted successfully'
        })

    } catch (error) {
        console.error('failed to delete meeting', error)
        return NextResponse.json({ error: 'failed to delete meeting' }, { status: 500 })
    }
}