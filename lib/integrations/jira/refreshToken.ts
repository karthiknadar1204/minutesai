import { db } from "@/lib/db";
import { userIntegrations } from "@/database/models";
import { eq } from "drizzle-orm";

export async function refreshJiraToken(integration: any) {
    try {
        const response = await fetch('https://auth.atlassian.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                grant_type: 'refresh_token',
                client_id: process.env.JIRA_CLIENT_ID!,
                client_secret: process.env.JIRA_CLIENT_SECRET!,
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
            console.error('failed to refresh jira token:', data)
            throw new Error('token refreshfailed')
        }
    } catch (error) {
        console.error('error refreshing jira token', error)
        throw error
    }
}