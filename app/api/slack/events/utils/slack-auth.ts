import { db } from "@/lib/db"
import { slackInstallations } from "@/database/models"
import { eq } from "drizzle-orm"

export async function authorizeSlack(source: { teamId?: string }) {
    try {
        const { teamId } = source

        if (!teamId) {
            throw new Error('No team ID provided')
        }
        const rows = await db
            .select()
            .from(slackInstallations)
            .where(eq(slackInstallations.teamId, teamId))
            .limit(1)

        const installation = rows[0]

        if (!installation || !installation.active) {
            console.error('installaion not found or inactive for the team:', teamId)
            throw new Error(`installation not found for team: ${teamId}`)
        }

        return {
            botToken: installation.botToken,
            teamId: installation.teamId
        }
    } catch (error) {
        console.error('auth error:', error)
        throw error
    }
}