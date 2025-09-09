import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { users } from "@/database/models";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const user = await currentUser()
        if (!user) {
            return NextResponse.json({ error: 'unautorized' }, { status: 401 })
        }

        const dbUser = await db.query.users.findFirst({
            where: eq(users.clerkId, user.id),
            columns: {
                botName: true,
                botImageUrl: true,
                currentPlan: true,
            },
        })

        return NextResponse.json({
            botName: dbUser?.botName || 'Meeting Bot',
            botImageUrl: dbUser?.botImageUrl || null,
            plan: dbUser?.currentPlan || 'free'
        })
    } catch (error) {
        console.error('error fetching bot settings:', error)
        return NextResponse.json({ error: 'internal server error' }, { status: 500 })
    }
}


export async function POST(request: Request) {
    try {
        const user = await currentUser()
        if (!user) {
            return NextResponse.json({ error: 'unautorized' }, { status: 401 })
        }

        const { botName, botImageUrl } = await request.json()

        await db
            .update(users)
            .set({
                botName: botName || 'Meeting Bot',
                botImageUrl: botImageUrl
            })
            .where(eq(users.clerkId, user.id))

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('error saving bot settings:', error)
        return NextResponse.json({ error: 'internal server error' }, { status: 500 })
    }
}