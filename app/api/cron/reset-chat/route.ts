import { db } from "@/lib/db";
import { users } from "@/database/models";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const result = await db.update(users)
            .set({ chatMessagesToday: 0 })
            .where(eq(users.subscriptionStatus, 'active'))

        return NextResponse.json({
            success: true,
            message: 'Daily chat reset completed successfully',
            usersReset: result.rowCount || 0,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('chat reset error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to reset the chat messages',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}
