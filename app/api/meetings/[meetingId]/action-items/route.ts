import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { meetings } from "@/database/models";
import { and, eq } from "drizzle-orm";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ meetingId: string }> }
) {

    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        }

        const { text } = await request.json()
        const { meetingId } = await params
        const meeting = await db.query.meetings.findFirst({
            where: and(eq(meetings.id, meetingId), eq(meetings.userId, userId))
        })

        if (!meeting) {
            return NextResponse.json({ error: 'meeting not found' }, { status: 404 })
        }

        const existingItems = (meeting.actionItems as any[]) || []
        const nextId = existingItems.length > 0
            ? Math.max(...existingItems.map((item: any) => item.id || 0)) + 1
            : 1

        const newActionItem = {
            id: nextId,
            text
        }

        const updatedActionItems = [...existingItems, newActionItem]

        await db
            .update(meetings)
            .set({ actionItems: updatedActionItems as any })
            .where(eq(meetings.id, meetingId))

        return NextResponse.json(newActionItem)
    } catch (error) {
        console.error('error adding action item', error)
        return NextResponse.json({ error: 'internal error' }, { status: 500 })
    }

}