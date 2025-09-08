import { db } from "@/lib/db";
import { userIntegrations } from "@/database/models";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const { userId } = await auth()
    const { token } = await request.json()


    if (!userId || !token) {
        return NextResponse.json({ error: "missing user id or token" }, { status: 400 })
    }

    try {
        const existing = await db
            .select({ id: userIntegrations.id })
            .from(userIntegrations)
            .where(and(eq(userIntegrations.userId, userId), eq(userIntegrations.platform, 'trello')))
            .limit(1)

        if (existing.length > 0) {
            await db
                .update(userIntegrations)
                .set({ accessToken: token, updatedAt: new Date() as any })
                .where(eq(userIntegrations.id, existing[0].id))
        } else {
            await db.insert(userIntegrations).values({
                id: randomUUID(),
                userId,
                platform: 'trello',
                accessToken: token,
            })
        }
        return NextResponse.json({ success: true })
    }
    catch (error) {
        console.error('error saving trello integration:', error)
        return NextResponse.json({ error: 'failed to save' }, { status: 500 })
    }
}