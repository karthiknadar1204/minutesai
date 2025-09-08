import { db } from "@/lib/db";
import { users, slackInstallations } from "@/database/models";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { WebClient } from "@slack/web-api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        }

        const userRows = await db
            .select()
            .from(users)
            .where(eq(users.clerkId, userId))
            .limit(1)
        const user = userRows[0]

        if (!user?.slackTeamId) {
            return NextResponse.json({ error: 'slack not connected' }, { status: 400 })
        }

        const installationRows = await db
            .select()
            .from(slackInstallations)
            .where(eq(slackInstallations.teamId, user.slackTeamId!))
            .limit(1)
        const installation = installationRows[0]

        if (!installation) {
            return NextResponse.json({ error: 'installation not found' }, { status: 400 })
        }

        const slack = new WebClient(installation.botToken)

        const channels = await slack.conversations.list({
            types: 'public_channel',
            limit: 50
        })

        return NextResponse.json({
            channels: channels.channels?.map(ch => ({
                id: ch.id,
                name: ch.name
            })) || []
        })
    } catch (error) {
        console.error('slack setup error:', error)
        return NextResponse.json({ error: 'failed to fetch channels' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        }

        const { channelId, channelName } = await request.json()

        await db
            .update(users)
            .set({ preferredChannelId: channelId, preferredChannelName: channelName })
            .where(eq(users.clerkId, userId))
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Slack setup save error:', error)
        return NextResponse.json({ error: 'failed to save setup' }, { status: 500 })
    }
}