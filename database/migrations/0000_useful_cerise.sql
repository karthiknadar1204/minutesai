CREATE TABLE "meetings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"meeting_url" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"attendees" json,
	"calendar_event_id" text,
	"is_from_calendar" boolean DEFAULT false,
	"bot_scheduled" boolean DEFAULT true,
	"bot_sent" boolean DEFAULT false,
	"bot_id" text,
	"bot_joined_at" timestamp,
	"meeting_ended" boolean DEFAULT false,
	"transcript_ready" boolean DEFAULT false,
	"transcript" json,
	"recording_url" text,
	"speakers" json,
	"summary" text,
	"action_items" json,
	"processed" boolean DEFAULT false,
	"processed_at" timestamp,
	"email_sent" boolean DEFAULT false,
	"email_sent_at" timestamp,
	"rag_processed" boolean DEFAULT false,
	"rag_processed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "meetings_calendar_event_id_unique" UNIQUE("calendar_event_id")
);
--> statement-breakpoint
CREATE TABLE "slack_installations" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"team_name" text NOT NULL,
	"bot_token" text NOT NULL,
	"installed_by" text NOT NULL,
	"installer_name" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "slack_installations_team_id_unique" UNIQUE("team_id")
);
--> statement-breakpoint
CREATE TABLE "transcript_chunks" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"speaker_name" text,
	"vector_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"platform" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp,
	"board_id" text,
	"board_name" text,
	"project_id" text,
	"project_name" text,
	"workspace_id" text,
	"domain" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text,
	"name" text,
	"bot_name" text DEFAULT 'Meeting Bot',
	"bot_image_url" text,
	"google_access_token" text,
	"google_refresh_token" text,
	"google_token_expiry" timestamp,
	"calendar_connected" boolean DEFAULT false,
	"slack_user_id" text,
	"slack_team_id" text,
	"slack_connected" boolean DEFAULT false,
	"preferred_channel_id" text,
	"preferred_channel_name" text,
	"current_plan" text DEFAULT 'free',
	"subscription_status" text DEFAULT 'inactive',
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"billing_period_start" timestamp,
	"meetings_this_month" integer DEFAULT 0,
	"chat_messages_today" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE INDEX "meetings_user_id_idx" ON "meetings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "meetings_start_time_idx" ON "meetings" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "slack_installations_team_id_idx" ON "slack_installations" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "transcript_chunks_meeting_id_idx" ON "transcript_chunks" USING btree ("meeting_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_integrations_user_id_platform_idx" ON "user_integrations" USING btree ("user_id","platform");--> statement-breakpoint
CREATE INDEX "users_clerk_id_idx" ON "users" USING btree ("clerk_id");