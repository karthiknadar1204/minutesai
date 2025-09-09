
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { meetings } from "@/database/models";
import { and, eq } from "drizzle-orm";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ meetingId: string; itemId: string }> }
) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        }

        const { meetingId, itemId } = await params
        const itemIdNumber = parseInt(itemId)

        const meeting = await db.query.meetings.findFirst({
            where: and(eq(meetings.id, meetingId), eq(meetings.userId, userId))
        })

        if (!meeting) {
            return NextResponse.json({ error: 'meeting not found' }, { status: 404 })
        }

        const actionItems = (meeting.actionItems as any[]) || []
        const updatedActionItems = actionItems.filter((item: any) => item.id !== itemIdNumber)

        await db
            .update(meetings)
            .set({ actionItems: updatedActionItems as any })
            .where(eq(meetings.id, meetingId))

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('error deleting action item:', error)
        return NextResponse.json({ error: 'internal error' }, { status: 500 })
    }
}
