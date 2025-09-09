import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { WebClient } from "@slack/web-api";
import { NextRequest, NextResponse } from "next/server";
import { users, meetings, slackInstallations } from "@/database/models";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
    let dbUser: any = null

    try {
        const user = await currentUser()

        if (!user) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
        }

        const { meetingId, summary, actionItems } = await request.json()

        const userRows = await db.select().from(users).where(eq(users.clerkId, user.id)).limit(1)
        dbUser = userRows[0]

        if (!dbUser || !dbUser.slackTeamId) {
            return NextResponse.json({ error: 'slack not connected' }, { status: 400 })
        }

        const installRows = await db.select().from(slackInstallations).where(eq(slackInstallations.teamId, dbUser.slackTeamId)).limit(1)
        const installation = installRows[0]

        if (!installation) {
            return NextResponse.json({ error: 'slack workspace not found' }, { status: 400 })
        }
        const slack = new WebClient(installation.botToken as string)
        const targetChannel = dbUser.preferredChannelId || '#general'

        const meetingRows = await db.select().from(meetings).where(eq(meetings.id, meetingId)).limit(1)
        const meeting = meetingRows[0]

        const meetingTitle = meeting?.title

        await slack.chat.postMessage({
            channel: targetChannel,
            blocks: [
                {
                    type: "header",
                    text: {
                        type: "plain_text",
                        text: "📝 Meeting Summary",
                        emoji: true
                    }
                },
                {
                    type: "section",
                    fields: [
                        {
                            type: "mrkdwn",
                            text: `*Meeting:*\n${meetingTitle}`
                        },
                        {
                            type: "mrkdwn",
                            text: `*Date:*\n${meeting?.startTime}`
                        }
                    ]
                },
                {
                    type: "divider"
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*📋 Summary:*\n${summary}`
                    }
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*✅ Action Items:*\n${actionItems}`
                    }
                },

                {
                    type: "context",
                    elements: [
                        {
                            type: "mrkdwn",
                            text: `Posted by ${user.firstName || 'User'} · ${new Date().toLocaleString()}`
                        }
                    ]
                }
            ]
        })

        return NextResponse.json({
            success: true,
            message: `Meeting summary posted to ${dbUser.preferredChannelName || '#general'}`
        })
    } catch (error) {
        console.error('error posting to slack:', error)

        return NextResponse.json({ error: 'failed to post to slack' }, { status: 500 })
    }
}