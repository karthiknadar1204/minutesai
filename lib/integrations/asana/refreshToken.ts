import { db } from "@/lib/db";
import { userIntegrations } from "@/database/models";
import { eq } from "drizzle-orm";

export async function refreshAsanaToken(integration: any) {
    try {
        const response = await fetch('https://app.asana.com/-/oauth_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: process.env.ASANA_CLIENT_ID!,
                client_secret: process.env.ASANA_CLIENT_SECRET!,
                refresh_token: integration.refreshToken!,
            }),
        })

        const data = await response.json()
        if (response.ok) {
            await db
                .update(userIntegrations)
                .set({
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    expiresAt: new Date(Date.now() + data.expires_in * 1000) as any,
                })
                .where(eq(userIntegrations.id, integration.id))

            return { ...integration, accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: new Date(Date.now() + data.expires_in * 1000) }
        } else {
            console.error('failed to refresh asana token:', data)
            throw new Error('token refreshfailed')
        }
    } catch (error) {
        console.error('error refreshing asana token', error)
        throw error
    }
}