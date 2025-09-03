import * as path from "path";
import * as fs from 'fs'
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { meetings as meetingsTable, users as usersTable } from "@/database/models";

async function seedMeetings() {
    try {
        const dataPath = path.join(__dirname, 'data')

        const transcript1 = JSON.parse(fs.readFileSync(path.join(dataPath, 'transcripts', 'transcript1.json'), 'utf8'))
        const transcript2 = JSON.parse(fs.readFileSync(path.join(dataPath, 'transcripts', 'transcript2.json'), 'utf8'))
        const transcript3 = JSON.parse(fs.readFileSync(path.join(dataPath, 'transcripts', 'transcript3.json'), 'utf8'))

        const summaryData = JSON.parse(fs.readFileSync(path.join(dataPath, 'summaries.json'), 'utf8'))
        const actionItems = JSON.parse(fs.readFileSync(path.join(dataPath, 'action-items.json'), 'utf8'))
        const titles = JSON.parse(fs.readFileSync(path.join(dataPath, 'title.json'), 'utf8'))

        const userId = 'user_32C58Rg7Yt2bRdiQ1cvPWGOmxoz'
        const recordingUrl = 'https://meetingbot1.s3.eu-north-1.amazonaws.com/test-audio.mp3'

        const now = new Date()
        const startTime = new Date(now.getTime() - 30 * 60 * 1000)
        const endTime = new Date(now.getTime() - 5 * 60 * 1000)

        const meetingsSeed = [
            {
                transcript: transcript1,
                title: titles[0].title,
                description: titles[0].description
            },
            {
                transcript: transcript2,
                title: titles[1].title,
                description: titles[1].description
            },
            {
                transcript: transcript3,
                title: titles[2].title,
                description: titles[2].description
            }
        ]

        // Ensure seed user exists
        await db
            .insert(usersTable)
            .values({
                id: userId,
                clerkId: userId,
                email: 'seed@example.com',
                name: 'Seed User',
            })
            .onConflictDoNothing()

        for (let i = 0; i < meetingsSeed.length; i++) {
            const meeting = meetingsSeed[i]

            await db.insert(meetingsTable).values({
                id: randomUUID(),
                userId: userId,
                title: meeting.title,
                description: meeting.description,
                meetingUrl: 'https://meet.google.com/cug-hszq-vqv',
                startTime: startTime,
                endTime: endTime,

                calendarEventId: randomUUID(),
                isFromCalendar: true,

                botScheduled: true,
                botSent: true,
                botId: randomUUID(),
                botJoinedAt: startTime,

                meetingEnded: true,
                transcriptReady: true,
                transcript: meeting.transcript,
                recordingUrl: recordingUrl,

                summary: summaryData.summary,
                actionItems: actionItems,
                processed: true,
                processedAt: endTime,
                emailSent: true,
                emailSentAt: endTime,
                ragProcessed: false,
            })
        }
    } catch (error) {
        console.error('error seeding meetings bruh', error)
    }
}

seedMeetings()