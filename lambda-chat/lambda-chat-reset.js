import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users } from './database/models.js'
import { eq } from 'drizzle-orm'

// Database connection pool - reuse across invocations
const connectionString = process.env.DATABASE_URL
const client = postgres(connectionString, {
    max: 1, // Lambda should use minimal connections
    idle_timeout: 20,
    connect_timeout: 10,
})
const db = drizzle(client)

export const handler = async (event) => {

    try {
        const result = await db.update(users)
            .set({ chatMessagesToday: 0 })
            .where(eq(users.subscriptionStatus, 'active'))

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'daily chat reset completed successfully',
                usersReset: result.rowCount || 0,
                timestamp: new Date().toISOString()
            })
        }

    } catch (error) {
        console.error('chat reset error:', error)

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'failed to reset the chat messages',
                details: error.message,
                timestamp: new Date().toISOString()
            })
        }
    } finally {
        // Don't close the connection pool in Lambda - let it persist for reuse
        // await client.end()
    }
}