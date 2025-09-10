import { db } from '@/lib/db'
import { users } from '@/database/models'
import { eq } from 'drizzle-orm'
import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-06-30.basil'
})

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()

        const user = await currentUser()

        if (!userId || !user) {
            return NextResponse.json({ error: 'not authenticated' }, { status: 401 })
        }

        const { priceId, planName } = await request.json()

        if (!priceId) {
            return NextResponse.json({ error: 'price Id is required' }, { status: 400 })
        }

        let dbUser = await db.select()
            .from(users)
            .where(eq(users.clerkId, userId))
            .limit(1)

        if (!dbUser.length) {
            await db.insert(users).values({
                id: userId,
                clerkId: userId,
                email: user.primaryEmailAddress?.emailAddress || null,
                name: user.fullName || null
            })
            // Fetch the created user
            dbUser = await db.select()
                .from(users)
                .where(eq(users.clerkId, userId))
                .limit(1)
        }

        const userRecord = dbUser[0]

        let stripeCustomerId = userRecord?.stripeCustomerId

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.primaryEmailAddress?.emailAddress!,
                name: user.fullName || undefined,
                metadata: {
                    clerkUserId: userId,
                    dbUserId: userRecord.id
                }
            })

            stripeCustomerId = customer.id

            await db.update(users)
                .set({ stripeCustomerId })
                .where(eq(users.id, userRecord.id))
        }

        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1
                }
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/home?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
            metadata: {
                clerkUserId: userId,
                dbUserId: userRecord.id,
                planName
            },
            subscription_data: {
                metadata: {
                    clerkUserId: userId,
                    dbUserId: userRecord.id,
                    planName
                }
            }
        })
        return NextResponse.json({ url: session.url })
    } catch (error) {
        console.error('stripe checkout error:', error)
        return NextResponse.json({ error: 'failed to create checkout session' }, { status: 500 })
    }
}