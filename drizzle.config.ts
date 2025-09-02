import { config } from 'dotenv';
import { defineConfig } from "drizzle-kit";


config({ path: '.env' });

export default defineConfig({
  schema: "./database/models.ts",
  out: "./database/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://karthiknadar1204:Fvph9DyfVm2L@ep-restless-credit-a1c7489o-pooler.ap-southeast-1.aws.neon.tech/minutesai?sslmode=require&channel_binding=require",
  },
});