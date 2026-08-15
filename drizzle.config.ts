import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL ?? "file:./data/app.db";
const isSqlite =
  connectionString.startsWith("file:") ||
  connectionString.startsWith("sqlite:") ||
  connectionString.endsWith(".db") ||
  connectionString.endsWith(".sqlite");

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: isSqlite ? "sqlite" : "mysql",
  dbCredentials: {
    url: connectionString,
  },
});
