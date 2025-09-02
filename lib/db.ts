// db.js
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as models from "../database/models";
import { config as appConfig } from "../config/app.config";

const connectionString = "postgresql://karthiknadar1204:Fvph9DyfVm2L@ep-restless-credit-a1c7489o-pooler.ap-southeast-1.aws.neon.tech/minutesai?sslmode=require&channel_binding=require";

declare global {
  var postgresClient: postgres.Sql | undefined;
}

const globalForPostgres = global as { postgresClient: postgres.Sql | undefined };

const client = globalForPostgres.postgresClient ?? postgres(connectionString);

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.postgresClient = client;
}

export const db = drizzle(client,{models});

export { client };