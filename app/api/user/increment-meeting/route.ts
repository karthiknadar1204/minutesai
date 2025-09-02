import { db } from "@/lib/db";
import { users } from "@/database/models";
import { eq } from "drizzle-orm";
import { incrementMeetingUsage } from "@/lib/usage";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'Not authed' }, { status: 401 })
        }

        const user = await db.select({
            id: users.id,
        })
        .from(users)
        .where(eq(users.clerkId, userId))
        .limit(1);

        if (!user || user.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        await incrementMeetingUsage(user[0].id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error incrementing meeting usage:', error);
        return NextResponse.json({ error: 'failed to increment usage' }, { status: 500 })
    }
}