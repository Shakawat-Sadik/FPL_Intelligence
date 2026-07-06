/*
pg: This is the standard, production-grade Node.js driver for PostgreSQL (node-postgres). It handles the raw networking and connection management with Postgres.

drizzle-orm/node-postgres: This is the Drizzle adapter that teaches Drizzle how to speak to that pg driver.

* as schema: This grabs all your table definitions (like users) from your schema file. Passing this to Drizzle unlocks Relational Queries—allowing you to write clean queries like db.query.users.findMany().
*/
// src/db/index.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// This connects to your Neon database using the URI in your .env.local
const pool = new Pool({
  connectionString: process.env.DB_URI!, // The exclamation mark tells TypeScript that we are sure this value is not null or undefined
});

export const db = drizzle(pool, { schema }); //This is the magic step. You feed your live connection pool and your schema blueprint into the drizzle function. It returns an initialized instance called db. This is the exact object you exported and plugged into your tRPC context setup earlier!

/*
What is a Pool? Opening and closing a brand new database connection for every single HTTP request is incredibly slow. A Pool keeps a collection of active, open connections ready to go. When a request comes in, it instantly borrows a connection, uses it, and hands it back.
*/