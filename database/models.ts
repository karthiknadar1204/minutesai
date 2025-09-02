import { pgTable, text, timestamp, boolean, integer, json, varchar, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// User table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  clerkId: text('clerk_id').unique().notNull(),
  email: text('email'),
  name: text('name'),
  
  botName: text('bot_name').default('Meeting Bot'),
  botImageUrl: text('bot_image_url'),
  
  googleAccessToken: text('google_access_token'),
  googleRefreshToken: text('google_refresh_token'),
  googleTokenExpiry: timestamp('google_token_expiry'),
  calendarConnected: boolean('calendar_connected').default(false),
  
  slackUserId: text('slack_user_id'),
  slackTeamId: text('slack_team_id'),
  slackConnected: boolean('slack_connected').default(false),
  preferredChannelId: text('preferred_channel_id'),
  preferredChannelName: text('preferred_channel_name'),
  
  currentPlan: text('current_plan').default('free'),
  subscriptionStatus: text('subscription_status').default('inactive'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  billingPeriodStart: timestamp('billing_period_start'),
  meetingsThisMonth: integer('meetings_this_month').default(0),
  chatMessagesToday: integer('chat_messages_today').default(0),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  clerkIdIdx: index('users_clerk_id_idx').on(table.clerkId),
}));

// SlackInstallation table
export const slackInstallations = pgTable('slack_installations', {
  id: text('id').primaryKey(),
  teamId: text('team_id').unique().notNull(),
  teamName: text('team_name').notNull(),
  botToken: text('bot_token', { mode: 'text' }).notNull(),
  installedBy: text('installed_by').notNull(),
  installerName: text('installer_name'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  teamIdIdx: index('slack_installations_team_id_idx').on(table.teamId),
}));

// Meeting table
export const meetings = pgTable('meetings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  meetingUrl: text('meeting_url'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  attendees: json('attendees'),
  
  calendarEventId: text('calendar_event_id').unique(),
  isFromCalendar: boolean('is_from_calendar').default(false),
  
  botScheduled: boolean('bot_scheduled').default(true),
  botSent: boolean('bot_sent').default(false),
  botId: text('bot_id'),
  botJoinedAt: timestamp('bot_joined_at'),
  
  meetingEnded: boolean('meeting_ended').default(false),
  transcriptReady: boolean('transcript_ready').default(false),
  transcript: json('transcript'),
  recordingUrl: text('recording_url'),
  speakers: json('speakers'),
  
  summary: text('summary'),
  actionItems: json('action_items'),
  processed: boolean('processed').default(false),
  processedAt: timestamp('processed_at'),
  emailSent: boolean('email_sent').default(false),
  emailSentAt: timestamp('email_sent_at'),
  ragProcessed: boolean('rag_processed').default(false),
  ragProcessedAt: timestamp('rag_processed_at'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('meetings_user_id_idx').on(table.userId),
  startTimeIdx: index('meetings_start_time_idx').on(table.startTime),
}));

// UserIntegration table
export const userIntegrations = pgTable('user_integrations', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  platform: text('platform').notNull(),
  accessToken: text('access_token', { mode: 'text' }).notNull(),
  refreshToken: text('refresh_token', { mode: 'text' }),
  expiresAt: timestamp('expires_at'),
  
  boardId: text('board_id'),
  boardName: text('board_name'),
  projectId: text('project_id'),
  projectName: text('project_name'),
  workspaceId: text('workspace_id'),
  domain: text('domain'),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userIdPlatformIdx: uniqueIndex('user_integrations_user_id_platform_idx').on(table.userId, table.platform),
}));

// TranscriptChunk table
export const transcriptChunks = pgTable('transcript_chunks', {
  id: text('id').primaryKey(),
  meetingId: text('meeting_id').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  content: text('content', { mode: 'text' }).notNull(),
  speakerName: text('speaker_name'),
  vectorId: text('vector_id'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  meetingIdIdx: index('transcript_chunks_meeting_id_idx').on(table.meetingId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  meetings: many(meetings),
}));

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
  user: one(users, {
    fields: [meetings.userId],
    references: [users.id],
  }),
  transcriptChunks: many(transcriptChunks),
}));

export const transcriptChunksRelations = relations(transcriptChunks, ({ one }) => ({
  meeting: one(meetings, {
    fields: [transcriptChunks.meetingId],
    references: [meetings.id],
  }),
}));


