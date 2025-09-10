import { processMeetingTranscript } from "@/lib/ai-processor";
import { db } from "@/lib/db";
import { meetings, users } from "@/database/models";
import { eq } from "drizzle-orm";
import { sendMeetingSummaryEmail } from "@/lib/email-service-free";
import { processTranscript } from "@/lib/rag";
import { incrementMeetingUsage } from "@/lib/usage";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const webhook = await request.json()

        if (webhook.event === 'complete') {
            const webhookData = webhook.data

            const meetingResult = await db.select({
                id: meetings.id,
                title: meetings.title,
                startTime: meetings.startTime,
                userId: meetings.userId,
                botId: meetings.botId,
                processed: meetings.processed,
                user: {
                    id: users.id,
                    email: users.email,
                    name: users.name
                }
            })
                .from(meetings)
                .innerJoin(users, eq(meetings.userId, users.id))
                .where(eq(meetings.botId, webhookData.bot_id))
                .limit(1)

            const meeting = meetingResult[0]

            if (!meeting) {
                console.error('meeting not found for bot id:', webhookData.bot_id)
                return NextResponse.json({ error: 'meeting not found' }, { status: 404 })
            }

            await incrementMeetingUsage(meeting.userId)

            if (!meeting.user.email) {
                console.error('user email not found for this meeting', meeting.id)
                return NextResponse.json({ error: 'user email not found' }, { status: 400 })
            }

            await db.update(meetings)
                .set({
                    meetingEnded: true,
                    transcriptReady: true,
                    transcript: webhookData.transcript || null,
                    recordingUrl: webhookData.mp4 || null,
                    speakers: webhookData.speakers || null
                })
                .where(eq(meetings.id, meeting.id))

            if (webhookData.transcript && !meeting.processed) {
                try {
                    const processed = await processMeetingTranscript(webhookData.transcript)

                    let transcriptText = ''

                    if (Array.isArray(webhookData.transcript)) {
                        transcriptText = webhookData.transcript
                            .map((item: any) => `${item.speaker || 'Speaker'}: ${item.words.map((w: any) => w.word).join(' ')}`)
                            .join('\n')
                    } else {
                        transcriptText = webhookData.transcript
                    }

                    try {
                        await sendMeetingSummaryEmail({
                            userEmail: meeting.user.email,
                            userName: meeting.user.name || 'User',
                            meetingTitle: meeting.title,
                            summary: processed.summary,
                            actionItems: processed.actionItems,
                            meetingId: meeting.id,
                            meetingDate: meeting.startTime.toLocaleDateString()
                        })

                        await db.update(meetings)
                            .set({
                                emailSent: true,
                                emailSentAt: new Date()
                            })
                            .where(eq(meetings.id, meeting.id))
                    } catch (emailError) {
                        console.error('failed to send the email:', emailError)
                    }

                    await processTranscript(meeting.id, meeting.userId, transcriptText, meeting.title)

                    await db.update(meetings)
                        .set({
                            summary: processed.summary,
                            actionItems: processed.actionItems,
                            processed: true,
                            processedAt: new Date(),
                            ragProcessed: true,
                            ragProcessedAt: new Date()
                        })
                        .where(eq(meetings.id, meeting.id))


                } catch (processingError) {
                    console.error('failed to process the transcript:', processingError)

                    await db.update(meetings)
                        .set({
                            processed: true,
                            processedAt: new Date(),
                            summary: 'processing failed. please check the transcript manually.',
                            actionItems: []
                        })
                        .where(eq(meetings.id, meeting.id))
                }
            }

            return NextResponse.json({
                success: true,
                message: 'meeting processed succesfully',
                meetingId: meeting.id
            })
        }
        return NextResponse.json({
            success: true,
            message: 'webhook recieved but no action needed bro'
        })
    } catch (error) {
        console.error('webhook processing errir:', error)
        return NextResponse.json({ error: 'internal server error' }, { status: 500 })
    }
}