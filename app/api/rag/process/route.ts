import { db } from "@/lib/db";
import { processTranscript } from "@/lib/rag";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { meetings } from "@/database/models";
import { and, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
    const { userId } = await auth()

    if (!userId) {
        return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
    }

    const { meetingId, transcript, meetingTitle } = await request.json()

    if (!meetingId || !transcript) {
        return NextResponse.json({ error: 'Missing meetingId or transcrpt' }, { status: 400 })
    }

    try {
        const meeting = await db.query.meetings.findFirst({
            where: and(eq(meetings.id, meetingId), eq(meetings.userId, userId)),
            columns: { ragProcessed: true, userId: true },
        })

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
        }

        if (meeting.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        if (meeting.ragProcessed) {
            return NextResponse.json({ success: true, message: 'aldready processed' })
        }

        await processTranscript(meetingId, userId, transcript, meetingTitle)

        await db
            .update(meetings)
            .set({ ragProcessed: true, ragProcessedAt: new Date() as any })
            .where(eq(meetings.id, meetingId))

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('error processing transcript:', error)
        return NextResponse.json({ error: 'failed to process transcript' }, { status: 500 })
    }
}