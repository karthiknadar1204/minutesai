import { db } from "@/lib/db";
import { userIntegrations } from "@/database/models";
import { and, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST() {
    const { userId } = await auth()

    if (!userId) {
        return NextResponse.json({ error: 'unauthoarized' }, { status: 401 })
    }

    try {
        await db
            .delete(userIntegrations)
            .where(and(eq(userIntegrations.userId, userId), eq(userIntegrations.platform, 'jira')))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error disconnecting jira:', error)
        return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
    }

}