import { db } from "@/lib/db";
import { users } from "@/database/models";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ connected: false })
        }

        const user = await db.select({
            calendarConnected: users.calendarConnected,
            googleAccessToken: users.googleAccessToken
        })
        .from(users)
        .where(eq(users.clerkId, userId))
        .limit(1);

        return NextResponse.json({
            connected: user[0]?.calendarConnected && !!user[0]?.googleAccessToken
        })
    } catch (error) {
        return NextResponse.json({ connected: false })
    }
}