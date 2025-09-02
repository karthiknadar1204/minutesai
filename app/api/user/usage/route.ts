import { db } from "@/lib/db";
import { users } from "@/database/models";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'not authed' }, { status: 401 })
        }

        const user = await db.select({
            currentPlan: users.currentPlan,
            subscriptionStatus: users.subscriptionStatus,
            meetingsThisMonth: users.meetingsThisMonth,
            chatMessagesToday: users.chatMessagesToday,
            billingPeriodStart: users.billingPeriodStart,
        })
        .from(users)
        .where(eq(users.clerkId, userId))
        .limit(1);

        if (!user || user.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json(user[0])
    } catch (error) {
        console.error('Error fetching user usage:', error);
        return NextResponse.json({ error: 'failed to fetch usage' }, { status: 500 })
    }
}