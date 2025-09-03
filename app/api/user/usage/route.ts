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
            // Return sensible defaults instead of 404 to avoid client-side errors before webhook creates user
            return NextResponse.json({
                currentPlan: 'free',
                subscriptionStatus: 'inactive',
                meetingsThisMonth: 0,
                chatMessagesToday: 0,
                billingPeriodStart: null,
            })
        }

        return NextResponse.json(user[0])
    } catch (error) {
        console.error('Error fetching user usage:', error);
        return NextResponse.json({ error: 'failed to fetch usage' }, { status: 500 })
    }
}