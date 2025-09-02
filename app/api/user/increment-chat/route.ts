import { db } from "@/lib/db";
import { users } from "@/database/models";
import { eq } from "drizzle-orm";
import { canUserChat, incrementChatUsage } from "@/lib/usage";
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
            currentPlan: users.currentPlan,
            subscriptionStatus: users.subscriptionStatus,
            chatMessagesToday: users.chatMessagesToday
        })
        .from(users)
        .where(eq(users.clerkId, userId))
        .limit(1);

        if (!user || user.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const userData = user[0];
        const chatCheck = await canUserChat(userData.id)

        if (!chatCheck.allowed) {
            return NextResponse.json({
                error: chatCheck.reason,
                upgradeRequired: true
            }, { status: 403 })
        }

        await incrementChatUsage(userData.id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error incrementing chat usage:', error);
        return NextResponse.json({ error: 'failed to increment usage' }, { status: 500 })
    }
}