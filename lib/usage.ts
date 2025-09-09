import { db } from "./db"
import { users } from "../database/models"
import { eq, sql } from "drizzle-orm"

interface PlanLimits {
    meetings: number
    chatMessages: number
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
    free: { meetings: 2, chatMessages: 20 },
    starter: { meetings: 10, chatMessages: 30 },
    pro: { meetings: 30, chatMessages: 100 },
    premium: { meetings: -1, chatMessages: -1 }
}

export async function canUserSendBot(userId: string) {
    const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

    if (!user || user.length === 0) {
        return { allowed: false, reason: 'User not found' }
    }

    const userData = user[0]

    if (userData.currentPlan === 'free' || userData.subscriptionStatus === 'expired') {
        return { allowed: false, reason: 'Upgrade your plan to send bots to meetings' }
    }

    const limits = PLAN_LIMITS[userData.currentPlan]

    if (!limits) {
        console.error(`❌ Unknown plan: ${userData.currentPlan}`)
        return { allowed: false, reason: 'Invalid subscription plan' }
    }

    if (limits.meetings !== -1 && userData.meetingsThisMonth >= limits.meetings) {
        return { allowed: false, reason: `You've reached your monthly limit of ${limits.meetings} meetings` }
    }

    return { allowed: true }
}

export async function canUserChat(userId: string) {
    const user = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

    if (!user || user.length === 0) {
        return { allowed: false, reason: 'user not found' }
    }

    const userData = user[0]

    // Allow free plan within daily limit. Paid tiers require active subscription.
    const limits = PLAN_LIMITS[userData.currentPlan] || PLAN_LIMITS.free

    if (userData.currentPlan !== 'free' && userData.subscriptionStatus !== 'active') {
        return { allowed: false, reason: 'Upgrade your plan to chat with our AI bot' }
    }

    if (limits.chatMessages !== -1 && userData.chatMessagesToday >= limits.chatMessages) {
        return { allowed: false, reason: `you've reached your daily limit of ${limits.chatMessages} messages` }
    }

    return { allowed: true }
}

export async function incrementMeetingUsage(userId: string) {
    await db.update(users)
        .set({
            meetingsThisMonth: sql`${users.meetingsThisMonth} + 1`
        })
        .where(eq(users.id, userId))
}

export async function incrementChatUsage(userId: string) {
    await db.update(users)
        .set({
            chatMessagesToday: sql`${users.chatMessagesToday} + 1`
        })
        .where(eq(users.id, userId))
}

export function getPlanLimits(plan: string): PlanLimits {
    return PLAN_LIMITS[plan] || PLAN_LIMITS.free
}