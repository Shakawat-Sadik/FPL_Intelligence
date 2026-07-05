How it all connects:
- schema.ts defines what my data looks like.
- db/index.ts (this file) spins up the active connection pool and links my schema.
- root.ts (tRPC Context) takes this db instance and passes it into the context payload.

The routers can now freely pull ctx.db to read and write data with 100% type-safety.
This is the magic step. As I feed my live connection pool and my schema blueprint into the drizzle function, it returns an initialized instance called db. This is the exact object I exported and plugged into my tRPC context setup earlier!


After configuring drizzle in ./drizzle.config.ts, `pnpm drizzle-kit push` will create the tables in my Neon database, and I can start writing queries in my tRPC routers.

```bash
saadiq@fedora:/run/media/saadiq/New Volume/Programmings/Personal Projects/fpligence$ pnpm drizzle-kit push
No config path provided, using default 'drizzle.config.ts'
Reading config file '/run/media/saadiq/New Volume/Programmings/Personal Projects/fpligence/drizzle.config.ts'
◇ injected env (4) from .env.local // tip: ⌘ multiple files { path: ['.env.local', '.env'] }
Using 'pg' driver for database querying
[⣷] Pulling schema from database...
(node:215939) Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weakersecurity guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=require'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.
[✓] Pulling schema from database...
[✓] Changes applied
```