import { db } from "@/lib/db";
import { meetings, users } from "@/database/models";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

export async function POST(
    request: NextRequest,
    { params }: { params: { meetingId: string } }
) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "not authed" }, { status: 401 })
        }

        const { meetingId } = params
        const { botScheduled } = await request.json()

        const user = await db.select({ id: users.id })
            .from(users)
            .where(eq(users.clerkId, userId))
            .limit(1);

        if (!user.length) {
            return NextResponse.json({ error: "user not found" }, { status: 404 })
        }

        const updated = await db.update(meetings)
            .set({ botScheduled })
            .where(and(eq(meetings.id, meetingId), eq(meetings.userId, user[0].id)))
            .returning();

        if (!updated.length) {
            return NextResponse.json({ error: "meeting not found" }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            botScheduled: updated[0].botScheduled,
            message: `Bot ${botScheduled ? 'enabled' : 'disabled'} for meeting`
        })
    } catch (error) {
        console.error('Bot toggle error:', error)
        return NextResponse.json({ error: "Failed to update bot status" }, { status: 500 })
    }
}


