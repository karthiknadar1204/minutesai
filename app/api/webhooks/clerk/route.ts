import { db } from "@/lib/db";
import { users } from "@/database/models";
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from 'svix'
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
    try {
        const payload = await request.text()
        const headers = {
            'svix-id': request.headers.get('svix-id') || '',
            'svix-timestamp': request.headers.get('svix-timestamp') || '',
            'svix-signature': request.headers.get('svix-signature') || '',
        }

        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
        if (webhookSecret) {
            const wh = new Webhook(webhookSecret)
            try {
                wh.verify(payload, headers)
            } catch (err) {
                return NextResponse.json({ error: 'Invalid Signature' }, { status: 400 })
            }
        }

        const event = JSON.parse(payload)
        console.log('clerk webhook received', event.type)

        if (event.type === 'user.created' || event.type === 'user.updated') {
            const { id, email_addresses, first_name, last_name, primary_email_address_id } = event.data
            const primaryEmail = email_addresses?.find((email: any) =>
                email.id === primary_email_address_id
            )?.email_address

            const fullName = `${first_name ?? ''} ${last_name ?? ''}`.trim()

            // Upsert by clerkId to be idempotent across replays/updates
            await db
                .insert(users)
                .values({
                    id: id,
                    clerkId: id,
                    email: primaryEmail || null,
                    name: fullName || null,
                })
                .onConflictDoUpdate({
                    target: users.clerkId,
                    set: {
                        email: primaryEmail || null,
                        name: fullName || null,
                        updatedAt: new Date(),
                    },
                })

            console.log(`user upserted for clerkId=${id} email=${primaryEmail ?? 'null'}`)
            return NextResponse.json({ message: `user ${event.type} processed` })
        }

        return NextResponse.json({ message: 'webhook received' })
    } catch (error) {
        console.error('webhook error:', error)
        return NextResponse.json({ error: 'Webhook processign failed' }, { status: 500 })
    }
}