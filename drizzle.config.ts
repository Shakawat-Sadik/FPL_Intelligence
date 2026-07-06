import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
    schema: "./src/server/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DB_URI!,
    }
})

/*
The catch is specifically drizzle.config.ts's schema field: drizzle-kit reads that as a plain filesystem glob string via its own file-matching logic — it never goes through the TypeScript compiler or Next's bundler, so it has no idea @ means anything. That's an inherent limitation of drizzle-kit's config, not something fixable by editing tsconfig.json further. So:
- Everywhere in your app code: use `@/db/schema`.
In drizzle.config.ts only: keep the literal ./src/db/schema.ts path (as it is now) since that field can't use the alias.
*/