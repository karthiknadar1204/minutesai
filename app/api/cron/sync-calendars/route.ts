import { db } from "@/lib/db";
import { users, meetings } from "@/database/models";
import { eq, and, gte, lte, isNotNull, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        await syncAllUserCalendars()
        await scheduleBotsForUpcomingMeetings()

        return NextResponse.json({
            success: true,
            message: 'Calendar sync and bot scheduling completed successfully',
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('cron sync error:', error)
        return NextResponse.json({
            success: false,
            error: 'internal server error',
            details: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}

async function syncAllUserCalendars() {
    const usersResult = await db.select()
        .from(users)
        .where(
            and(
                eq(users.calendarConnected, true),
                isNotNull(users.googleAccessToken)
            )
        )

    for (const user of usersResult) {
        try {
            await syncUserCalendar(user)
        } catch (error) {
            console.error(`sync failed for ${user.id}:`, error instanceof Error ? error.message : 'Unknown error')
        }
    }
}

async function syncUserCalendar(user: any) {
    try {
        let accessToken = user.googleAccessToken

        const now = new Date()
        const tokenExpiry = new Date(user.googleTokenExpiry)
        const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000)

        if (tokenExpiry <= tenMinutesFromNow) {
            accessToken = await refreshGoogleToken(user)
            if (!accessToken) {
                return
            }
        }
        const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
            `timeMin=${now.toISOString()}&` +
            `timeMax=${sevenDays.toISOString()}&` +
            `singleEvents=true&orderBy=startTime&showDeleted=true`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        )
        if (!response.ok) {
            if (response.status === 401) {
                await db.update(users)
                    .set({ calendarConnected: false })
                    .where(eq(users.id, user.id))
                return
            }
            throw new Error(`Calendar API failed: ${response.status}`)
        }
        const data = await response.json()
        const events = data.items || []
        const existingEvents = await db.select()
            .from(meetings)
            .where(
                and(
                    eq(meetings.userId, user.id),
                    eq(meetings.isFromCalendar, true),
                    gte(meetings.startTime, now)
                )
            )

        const googleEventIds = new Set()
        for (const event of events) {
            if (event.status === 'cancelled') {
                await handleDeletedEvent(event)
                continue
            }
            googleEventIds.add(event.id)
            await processEvent(user, event)
        }

        const deletedEvents = existingEvents.filter(
            dbEvent => !googleEventIds.has(dbEvent.calendarEventId)
        )

        if (deletedEvents.length > 0) {
            for (const deletedEvent of deletedEvents) {
                await handleDeletedEventFromDB(user, deletedEvent)
            }
        }
    } catch (error) {
        console.error(`calendar error for ${user.id}:`, error instanceof Error ? error.message : 'Unknown error')
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
            await db.update(users)
                .set({ calendarConnected: false })
                .where(eq(users.id, user.id))
        }
    }
}

async function refreshGoogleToken(user: any) {
    try {
        if (!user.googleRefreshToken) {
            await db.update(users)
                .set({
                    calendarConnected: false,
                    googleAccessToken: null
                })
                .where(eq(users.id, user.id))
            return null
        }

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                refresh_token: user.googleRefreshToken,
                grant_type: 'refresh_token'
            })
        })
        const tokens = await response.json()

        if (!tokens.access_token) {
            await db.update(users)
                .set({ calendarConnected: false })
                .where(eq(users.id, user.id))
            return null
        }

        await db.update(users)
            .set({
                googleAccessToken: tokens.access_token,
                googleTokenExpiry: new Date(Date.now() + (tokens.expires_in * 1000))
            })
            .where(eq(users.id, user.id))
        return tokens.access_token
    } catch (error) {
        console.error(`token refresh error for ${user.clerkId}: `, error)
        await db.update(users)
            .set({ calendarConnected: false })
            .where(eq(users.id, user.id))
        return null
    }
}

async function handleDeletedEvent(event: any) {
    try {
        const existingMeeting = await db.select()
            .from(meetings)
            .where(eq(meetings.calendarEventId, event.id))
            .limit(1)

        if (existingMeeting.length > 0) {
            await db.delete(meetings)
                .where(eq(meetings.calendarEventId, event.id))
        }
    } catch (error) {
        console.error('error deleting event:', error instanceof Error ? error.message : 'Unknown error')
    }
}

async function handleDeletedEventFromDB(dbEvent: any) {
    await db.delete(meetings)
        .where(eq(meetings.id, dbEvent.id))
}

async function processEvent(user: any, event: any) {
    const meetingUrl = event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri
    if (!meetingUrl || !event.start?.dateTime) {
        return
    }

    const eventData = {
        id: `meeting_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`, // Generate unique ID
        calendarEventId: event.id,
        userId: user.id,
        title: event.summary || 'Untitled Meeting',
        description: event.description || null,
        meetingUrl: meetingUrl,
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime),
        attendees: event.attendees ? JSON.stringify(event.attendees.map((a: any) => a.email)) : null,
        isFromCalendar: true,
        botScheduled: true
    }

    try {
        const existingMeeting = await db.select()
            .from(meetings)
            .where(eq(meetings.calendarEventId, event.id))
            .limit(1)

        if (existingMeeting.length > 0) {
            const existing = existingMeeting[0]
            const changes = []
            if (existing.title !== eventData.title) changes.push('title')
            if (existing.startTime.getTime() !== eventData.startTime.getTime()) changes.push('time')
            if (existing.meetingUrl !== eventData.meetingUrl) changes.push('meeting url')
            if (existing.attendees !== eventData.attendees) changes.push('attendees')

            const updateData = {
                title: eventData.title,
                description: eventData.description,
                meetingUrl: eventData.meetingUrl,
                startTime: eventData.startTime,
                endTime: eventData.endTime,
                attendees: eventData.attendees
            }

            if (!existing.botSent) {
                updateData.botScheduled = eventData.botScheduled
            }
            await db.update(meetings)
                .set(updateData)
                .where(eq(meetings.calendarEventId, event.id))
        } else {
            await db.insert(meetings).values(eventData)
        }
    } catch (error) {
        console.error(`error for ${event.id}:`, error instanceof Error ? error.message : 'Unknown error')
    }
}

async function scheduleBotsForUpcomingMeetings() {
    const now = new Date()
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)

    const upcomingMeetings = await db.select({
        id: meetings.id,
        title: meetings.title,
        meetingUrl: meetings.meetingUrl,
        startTime: meetings.startTime,
        endTime: meetings.endTime,
        userId: meetings.userId,
        botScheduled: meetings.botScheduled,
        botSent: meetings.botSent,
        user: {
            id: users.id,
            botName: users.botName,
            botImageUrl: users.botImageUrl,
            currentPlan: users.currentPlan,
            subscriptionStatus: users.subscriptionStatus,
            meetingsThisMonth: users.meetingsThisMonth
        }
    })
        .from(meetings)
        .innerJoin(users, eq(meetings.userId, users.id))
        .where(
            and(
                gte(meetings.startTime, now),
                lte(meetings.startTime, fiveMinutesFromNow),
                eq(meetings.botScheduled, true),
                eq(meetings.botSent, false),
                isNotNull(meetings.meetingUrl)
            )
        )

    for (const meeting of upcomingMeetings) {
        try {
            const canSchedule = await canUserScheduleMeeting(meeting.user)

            if (!canSchedule.allowed) {
                await db.update(meetings)
                    .set({
                        botSent: true,
                        botJoinedAt: new Date()
                    })
                    .where(eq(meetings.id, meeting.id))
                continue
            }
            const requestBody = {
                meeting_url: meeting.meetingUrl,
                bot_name: meeting.user.botName || 'AI Noteetaker',
                reserved: false,
                recording_mode: 'speaker_view',
                speech_to_text: { provider: "Default" },
                webhook_url: process.env.WEBHOOK_URL,
                extra: {
                    meeting_id: meeting.id,
                    user_id: meeting.userId
                }
            }

            if (meeting.user.botImageUrl) {
                requestBody.bot_image = meeting.user.botImageUrl
            }

            const response = await fetch('https://api.meetingbaas.com/bots', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-meeting-baas-api-key': process.env.MEETING_BAAS_API_KEY!
                },
                body: JSON.stringify(requestBody)
            })

            if (!response.ok) {
                throw new Error(`meeting baas api req failed: ${response.status}`)
            }

            const data = await response.json()

            await db.update(meetings)
                .set({
                    botSent: true,
                    botId: data.bot_id,
                    botJoinedAt: new Date()
                })
                .where(eq(meetings.id, meeting.id))

            await incrementMeetingUsage(meeting.userId)
        } catch (error) {
            console.error(`bot failed for ${meeting.title}: `, error instanceof Error ? error.message : 'Unknown error')
        }
    }
}

async function canUserScheduleMeeting(user: any) {
    try {
        const PLAN_LIMITS = {
            free: { meetings: 0 },
            starter: { meetings: 10 },
            pro: { meetings: 30 },
            premium: { meetings: -1 }
        }
        const limits = PLAN_LIMITS[user.currentPlan] || PLAN_LIMITS.free

        if (user.currentPlan === 'free' || user.subscriptionStatus !== 'active') {
            return {
                allowed: false,
                reason: `${user.currentPlan === 'free' ? 'Free plan' : 'Inactive subscription'} - upgrade required`
            }
        }

        if (limits.meetings !== -1 && user.meetingsThisMonth >= limits.meetings) {
            return {
                allowed: false,
                reason: `Monthly limit reached (${user.meetingsThisMonth}/${limits.meetings})`
            }
        }
        return {
            allowed: true
        }
    } catch (error) {
        console.error('error checking meeting limits:', error)
        return {
            allowed: false,
            reason: 'Error checking limits'
        }
    }
}

async function incrementMeetingUsage(userId: string) {
    try {
        // Get current count first
        const userResult = await db.select({ meetingsThisMonth: users.meetingsThisMonth })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)

        if (userResult.length > 0) {
            const currentCount = userResult[0].meetingsThisMonth || 0
            await db.update(users)
                .set({ meetingsThisMonth: currentCount + 1 })
                .where(eq(users.id, userId))
        }
    } catch (error) {
        console.error('error incrementing meeting usage:', error)
    }
}
