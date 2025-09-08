import { db } from "@/lib/db"
import { userIntegrations } from "@/database/models"
import { and, eq } from "drizzle-orm"
import { JiraAPI } from "@/lib/integrations/jira/jira"
import { refreshJiraToken } from "@/lib/integrations/jira/refreshToken"
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

async function getValidToken(integration: any) {
    if (integration.expiresAt && new Date() > integration.expiresAt) {
        const updated = await refreshJiraToken(integration)
        return updated.accessToken
    }

    return integration.accessToken
}

export async function GET() {
    const { userId } = await auth()

    if (!userId) {
        return NextResponse.json({ error: 'unauthoarized' }, { status: 401 })
    }

    const integration = (await db
        .select()
        .from(userIntegrations)
        .where(and(eq(userIntegrations.userId, userId), eq(userIntegrations.platform, 'jira')))
        .limit(1))[0]
    if (!integration || !integration.workspaceId) {
        return NextResponse.json({ error: 'not connected' }, { status: 400 })
    }

    try {
        const validToken = await getValidToken(integration)
        const jira = new JiraAPI()

        const projects = await jira.getProjects(validToken, integration.workspaceId)
        return NextResponse.json(
            {
                projects: projects.values || []
            }
        )
    } catch (error) {
        console.error('error fetching jira projects:', error)
        return NextResponse.json({ error: 'failed to fetch proejcts' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const { userId } = await auth()

    const { projectId, projectName, projectKey, createNew } = await request.json()

    if (!userId) {
        return NextResponse.json({ error: 'unauthoarized' }, { status: 401 })
    }


    const integration = (await db
        .select()
        .from(userIntegrations)
        .where(and(eq(userIntegrations.userId, userId), eq(userIntegrations.platform, 'jira')))
        .limit(1))[0]
    if (!integration || !integration.workspaceId) {
        return NextResponse.json({ error: 'not connected' }, { status: 400 })
    }

    try {
        const validToken = await getValidToken(integration)

        const jira = new JiraAPI()

        let finalProjectId = projectId
        let finalProjectName = projectName
        let finalProjectKey = projectKey

        if (createNew && projectName) {
            try {
                const suggestedKey = projectName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10)
                const key = projectKey || suggestedKey
                const newProject = await jira.createProject(
                    validToken,
                    integration.workspaceId,
                    projectName,
                    key)
                finalProjectId = newProject.id
                finalProjectName = projectName
                finalProjectKey = newProject.key
            } catch (error) {
                console.error('failed to create prohect:', error)
                return NextResponse.json({
                    error: 'failed to create project. you may not have admin permisisons'
                }, { status: 403 })
            }
        }

        // If projectKey is provided from the client, prefer it and avoid extra API calls.
        else if (projectKey) {
            finalProjectKey = projectKey
            finalProjectName = projectName || finalProjectName
        }
        // Fallback: if only projectId is provided, fetch projects to resolve name/key
        else if (projectId) {
            const projects = await jira.getProjects(validToken, integration.workspaceId)
            const selectedProject = projects.values.find((p: any) => p.id === projectId)

            if (!selectedProject) {
                return NextResponse.json({ error: 'project not found' }, { status: 404 })
            }

            finalProjectKey = selectedProject.key
            finalProjectName = selectedProject.name
        }
        else {
            return NextResponse.json({ error: 'either projectId or createNew with projectName must be provided' }, { status: 400 })
        }

        await db
            .update(userIntegrations)
            .set({ projectId: finalProjectKey, projectName: finalProjectName })
            .where(eq(userIntegrations.id, integration.id))

        return NextResponse.json({
            success: true,
            projectId: finalProjectKey,
            projectName: finalProjectName
        })
    } catch (error) {
        console.error('Error setting up jira project:', error)
        return NextResponse.json({ error: 'Failed to setup project' }, { status: 500 })
    }
}