import { db } from "@/lib/db";
import { users } from "@/database/models";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-06-30.basil'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
    try {
        const body = await request.text()
        const headersList = await headers()
        const sig = headersList.get('stripe-signature')!

        let event: Stripe.Event

        try {
            event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
        } catch (error) {
            console.error('webhok signature failed:', error)
            return NextResponse.json({ error: 'invalid signature' }, { status: 400 })
        }

        switch (event.type) {
            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object)
                break
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object)
                break
            case 'customer.subscription.deleted':
                await handleSubscriptionCancelled(event.data.object)
                break
            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object)
                break

            default:
                console.log(`unhandle type event: ${event.type}`)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('error handling subscription create:', error)
        return NextResponse.json({ error: 'webhook failed' }, { status: 500 })
    }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
    try {
        const customerId = subscription.customer as string
        const planName = getPlanFromSubscription(subscription)

        const userResult = await db.select()
            .from(users)
            .where(eq(users.stripeCustomerId, customerId))
            .limit(1)

        if (userResult.length > 0) {
            const user = userResult[0]
            await db.update(users)
                .set({
                    currentPlan: planName,
                    subscriptionStatus: 'active',
                    stripeSubscriptionId: subscription.id,
                    billingPeriodStart: new Date(),
                    meetingsThisMonth: 0,
                    chatMessagesToday: 0
                })
                .where(eq(users.id, user.id))
        }
    } catch (error) {
        console.error('error handling subscription create:', error)
    }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    try {
        const userResult = await db.select()
            .from(users)
            .where(eq(users.stripeSubscriptionId, subscription.id))
            .limit(1)

        if (userResult.length > 0) {
            const user = userResult[0]
            const planName = getPlanFromSubscription(subscription)

            await db.update(users)
                .set({
                    currentPlan: planName,
                    subscriptionStatus: subscription.status === 'active' ? 'active' : 'cancelled'
                })
                .where(eq(users.id, user.id))
        }
    } catch (error) {
        console.error('error handling subscription updated:', error)
    }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
    try {
        const userResult = await db.select()
            .from(users)
            .where(eq(users.stripeSubscriptionId, subscription.id))
            .limit(1)
        
        if (userResult.length > 0) {
            const user = userResult[0]
            await db.update(users)
                .set({
                    subscriptionStatus: 'cancelled'
                })
                .where(eq(users.id, user.id))
        }
    } catch (error) {
        console.error('error handling subscription cancelleation:', error)
    }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
    try {
        const subscriptionId = (invoice as any).subscription as string | null

        if (subscriptionId) {
            const userResult = await db.select()
                .from(users)
                .where(eq(users.stripeSubscriptionId, subscriptionId))
                .limit(1)

            if (userResult.length > 0) {
                const user = userResult[0]
                await db.update(users)
                    .set({
                        subscriptionStatus: 'active',
                        billingPeriodStart: new Date(),
                        meetingsThisMonth: 0
                    })
                    .where(eq(users.id, user.id))
            }
        }
    } catch (error) {
        console.error('error handling payment suucession:', error)
    }
}




function getPlanFromSubscription(subscription: Stripe.Subscription) {
    const priceId = subscription.items.data[0]?.price.id

    const priceToPlank: Record<string, string> = {
        'price_1S5l8kSTpsjALaKw4itgipR0': 'starter',
        'price_1S5l8kSTpsjALaKwQcY7ECSL': 'pro',
        'price_1S5l8kSTpsjALaKw4itgipR0': 'premium'
    }

    return priceToPlank[priceId] || 'invalid'
}