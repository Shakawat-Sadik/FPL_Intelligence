# Drizzle ORM Cheat Sheet — pg-core

## 1. Table basics

| What you want to do in plain English | The Drizzle TypeScript Code                    | The SQL it secretly generates            |
| :----------------------------------- | :--------------------------------------------- | :--------------------------------------- |
| **Create a table**                   | `pgTable("user", { ... })`                     | `CREATE TABLE user (...)`                |
| **Make a text column**               | `varchar("name", { length: 255 })`             | `VARCHAR(255)`                           |
| **Make it required**                 | `.notNull()`                                   | `NOT NULL`                               |
| **Make it unique**                   | `.unique()`                                    | `UNIQUE`                                 |
| **Get all users**                    | `db.select().from(user)`                       | `SELECT * FROM user`                     |
| **Get one user**                     | `db.select().from(user).where(eq(user.id, 1))` | `SELECT * FROM user WHERE id = 1`        |
| **Add a user**                       | `db.insert(user).values({ name: "Ali" })`      | `INSERT INTO user (name) VALUES ('Ali')` |

---

## 2. Column types (`drizzle-orm/pg-core`)

| Plain English                      | Drizzle code                                      | SQL type                  |
| :--------------------------------- | :------------------------------------------------ | :------------------------ |
| Auto-incrementing integer id       | `serial("id")`                                    | `SERIAL`                  |
| Auto-incrementing big integer id   | `bigserial("id", { mode: "number" })`             | `BIGSERIAL`               |
| Plain integer                      | `integer("age")`                                  | `INTEGER`                 |
| Big integer                        | `bigint("views", { mode: "number" })`             | `BIGINT`                  |
| Small integer                      | `smallint("qty")`                                 | `SMALLINT`                |
| Decimal / money-safe number        | `numeric("price", { precision: 10, scale: 2 })`   | `NUMERIC(10,2)`           |
| Floating point                     | `doublePrecision("score")`                        | `DOUBLE PRECISION`        |
| Real (single precision float)      | `real("score")`                                   | `REAL`                    |
| True/false                         | `boolean("is_active")`                            | `BOOLEAN`                 |
| Short text (bounded)               | `varchar("name", { length: 255 })`                | `VARCHAR(255)`            |
| Fixed-length text                  | `char("code", { length: 5 })`                     | `CHAR(5)`                 |
| Unbounded text                     | `text("bio")`                                     | `TEXT`                    |
| UUID                               | `uuid("id")`                                      | `UUID`                    |
| Date + time                        | `timestamp("created_at")`                         | `TIMESTAMP`               |
| Date + time with timezone          | `timestamp("created_at", { withTimezone: true })` | `TIMESTAMPTZ`             |
| Date only                          | `date("birthday")`                                | `DATE`                    |
| Time only                          | `time("start_time")`                              | `TIME`                    |
| Interval                           | `interval("duration")`                            | `INTERVAL`                |
| JSON (untyped)                     | `json("metadata")`                                | `JSON`                    |
| JSON (binary, indexable, faster)   | `jsonb("metadata")`                               | `JSONB`                   |
| Raw bytes                          | `customType(...)` / `bytea` via custom            | `BYTEA`                   |
| Enum type                          | `pgEnum("status", ["active", "banned"])`          | `CREATE TYPE ... AS ENUM` |
| Array of a type                    | `integer("tags").array()`                         | `INTEGER[]`               |
| Point / geometric (via extensions) | `customType` or `postgis` community package       | `POINT`, `GEOMETRY`, etc. |

```ts
import { pgEnum } from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status", ["active", "inactive", "banned"]);

export const users = pgTable("users", {
  status: statusEnum("status").default("active"),
});
```

---

## 3. Column modifiers

| Plain English                    | Drizzle code                                       | SQL                                |
| :------------------------------- | :------------------------------------------------- | :--------------------------------- |
| Not nullable                     | `.notNull()`                                       | `NOT NULL`                         |
| Unique value                     | `.unique()`                                        | `UNIQUE`                           |
| Named unique constraint          | `.unique("custom_name")`                           | `CONSTRAINT custom_name UNIQUE`    |
| Default static value             | `.default("pending")`                              | `DEFAULT 'pending'`                |
| Default current timestamp        | `.defaultNow()`                                    | `DEFAULT now()`                    |
| Default random UUID              | `.defaultRandom()`                                 | `DEFAULT gen_random_uuid()`        |
| Default from raw SQL             | `.default(sql\`now() + interval '1 day'\`)`        | `DEFAULT now() + interval '1 day'` |
| Primary key                      | `.primaryKey()`                                    | `PRIMARY KEY`                      |
| Auto-generated (identity) column | `.generatedAlwaysAsIdentity()`                     | `GENERATED ALWAYS AS IDENTITY`     |
| Generated/computed column        | `.generatedAlwaysAs(sql\`...\`)`                   | `GENERATED ALWAYS AS (...) STORED` |
| Foreign key reference            | `.references(() => otherTable.id)`                 | `REFERENCES other_table(id)`       |
| On-delete cascade                | `.references(() => t.id, { onDelete: "cascade" })` | `ON DELETE CASCADE`                |
| On-update cascade                | `.references(() => t.id, { onUpdate: "cascade" })` | `ON UPDATE CASCADE`                |

```ts
authorId: uuid("author_id")
  .references(() => users.id, { onDelete: "cascade" })
  .notNull(),
```

`onDelete` / `onUpdate` values: `"cascade" | "restrict" | "no action" | "set null" | "set default"`.

---

## 4. Table-level constraints & indexes

Use the third argument of `pgTable` (a callback receiving the table columns) for composite keys, indexes, and checks.

| Plain English                    | Drizzle code                                                      | SQL                                       |
| :------------------------------- | :---------------------------------------------------------------- | :---------------------------------------- |
| Composite primary key            | `primaryKey({ columns: [t.userId, t.roleId] })`                   | `PRIMARY KEY (user_id, role_id)`          |
| Composite unique constraint      | `unique().on(t.orgId, t.slug)`                                    | `UNIQUE (org_id, slug)`                   |
| Simple index                     | `index("email_idx").on(t.email)`                                  | `CREATE INDEX email_idx ON ... (email)`   |
| Unique index                     | `uniqueIndex("email_uidx").on(t.email)`                           | `CREATE UNIQUE INDEX ...`                 |
| Index on expression              | `index("lower_email_idx").on(sql\`lower(${t.email})\`)`           | `CREATE INDEX ... (lower(email))`         |
| Partial index                    | `index("active_idx").on(t.id).where(sql\`${t.isActive} = true\`)` | `CREATE INDEX ... WHERE is_active = true` |
| Check constraint                 | `check("age_check", sql\`${t.age} >= 0\`)`                        | `CHECK (age >= 0)`                        |
| Named foreign key at table level | `foreignKey({ columns: [t.a], foreignColumns: [other.id] })`      | `FOREIGN KEY (a) REFERENCES other(id)`    |

```ts
import {
  pgTable,
  uuid,
  varchar,
  index,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";

export const orgMembers = pgTable(
  "org_members",
  {
    orgId: uuid("org_id").notNull(),
    userId: uuid("user_id").notNull(),
    role: varchar("role", { length: 50 }).notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.orgId, t.userId] }),
    index("org_members_role_idx").on(t.role),
  ],
);
```

> Note: newer Drizzle versions use an **array-returning callback** `(t) => [...]` instead of an object; older versions use `(t) => ({ ... })`. Check your installed version's docs if TypeScript complains.

---

## 5. Relations (for `db.query.*` relational API)

```ts
import { relations } from "drizzle-orm";

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  comments: many(comments),
}));

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));
```

| Plain English                     | Drizzle code                                                       |
| :-------------------------------- | :----------------------------------------------------------------- |
| One-to-many (user has posts)      | `many(posts)`                                                      |
| Many-to-one (post has one author) | `one(users, { fields: [posts.authorId], references: [users.id] })` |
| Many-to-many (via join table)     | Define relations on the join table pointing both ways with `one()` |

---

## 6. Queries — Query Builder API (`db.select/insert/update/delete`)

### Select

| Plain English              | Drizzle code                                                                                      | SQL                                         |
| :------------------------- | :------------------------------------------------------------------------------------------------ | :------------------------------------------ |
| All rows                   | `db.select().from(users)`                                                                         | `SELECT * FROM users`                       |
| Specific columns           | `db.select({ id: users.id, email: users.email }).from(users)`                                     | `SELECT id, email FROM users`               |
| Where clause               | `.where(eq(users.id, id))`                                                                        | `WHERE id = $1`                             |
| Multiple conditions (AND)  | `.where(and(eq(users.active, true), gt(users.age, 18)))`                                          | `WHERE active = true AND age > 18`          |
| Multiple conditions (OR)   | `.where(or(eq(users.role, "admin"), eq(users.role, "owner")))`                                    | `WHERE role = 'admin' OR role = 'owner'`    |
| Not equal                  | `ne(users.status, "banned")`                                                                      | `status <> 'banned'`                        |
| Greater/less than          | `gt`, `gte`, `lt`, `lte`                                                                          | `>`, `>=`, `<`, `<=`                        |
| In a list                  | `inArray(users.id, [1, 2, 3])`                                                                    | `id IN (1,2,3)`                             |
| Not in a list              | `notInArray(users.id, [1, 2, 3])`                                                                 | `id NOT IN (1,2,3)`                         |
| Is null                    | `isNull(users.deletedAt)`                                                                         | `deleted_at IS NULL`                        |
| Is not null                | `isNotNull(users.deletedAt)`                                                                      | `deleted_at IS NOT NULL`                    |
| Pattern match              | `like(users.name, "%ali%")` / `ilike(...)` (case-insensitive)                                     | `LIKE '%ali%'` / `ILIKE`                    |
| Negate a condition         | `not(eq(users.active, true))`                                                                     | `NOT (active = true)`                       |
| Order results              | `.orderBy(asc(users.name))` / `desc(users.createdAt)`                                             | `ORDER BY name ASC`                         |
| Limit results              | `.limit(10)`                                                                                      | `LIMIT 10`                                  |
| Skip results (pagination)  | `.offset(20)`                                                                                     | `OFFSET 20`                                 |
| Group rows                 | `.groupBy(users.role)`                                                                            | `GROUP BY role`                             |
| Filter groups              | `.having(gt(count(), 5))`                                                                         | `HAVING count(*) > 5`                       |
| Inner join                 | `.innerJoin(posts, eq(posts.authorId, users.id))`                                                 | `INNER JOIN posts ON ...`                   |
| Left join                  | `.leftJoin(posts, eq(posts.authorId, users.id))`                                                  | `LEFT JOIN posts ON ...`                    |
| Right join                 | `.rightJoin(...)`                                                                                 | `RIGHT JOIN ...`                            |
| Full join                  | `.fullJoin(...)`                                                                                  | `FULL JOIN ...`                             |
| Distinct rows              | `db.selectDistinct().from(users)`                                                                 | `SELECT DISTINCT * FROM users`              |
| Count rows                 | `db.select({ count: count() }).from(users)`                                                       | `SELECT count(*) FROM users`                |
| Aggregate: sum/avg/min/max | `sum(users.age)`, `avg(...)`, `min(...)`, `max(...)`                                              | `SUM(age)`, etc.                            |
| Get one row (first match)  | `.limit(1)` then `result[0]`                                                                      | `LIMIT 1`                                   |
| Subquery                   | `db.select().from(users).where(inArray(users.id, db.select({ id: posts.authorId }).from(posts)))` | `WHERE id IN (SELECT author_id FROM posts)` |
| Union                      | `union(query1, query2)`                                                                           | `... UNION ...`                             |
| Raw SQL fragment inline    | `sql\`lower(${users.email})\``                                                                    | `lower(email)`                              |

```ts
import { eq, and, or, gt, desc, count } from "drizzle-orm";

const activeAdults = await db
  .select({ id: users.id, name: users.name })
  .from(users)
  .where(and(eq(users.status, "active"), gt(users.age, 18)))
  .orderBy(desc(users.createdAt))
  .limit(10)
  .offset(0);
```

### Insert

| Plain English                         | Drizzle code                                                            | SQL                                          |
| :------------------------------------ | :---------------------------------------------------------------------- | :------------------------------------------- |
| Insert one row                        | `db.insert(users).values({ email: "a@b.com" })`                         | `INSERT INTO users (email) VALUES (...)`     |
| Insert many rows                      | `db.insert(users).values([{ email: "a@b.com" }, { email: "c@d.com" }])` | multi-row `INSERT`                           |
| Return inserted row(s)                | `.returning()`                                                          | `RETURNING *`                                |
| Return specific columns               | `.returning({ id: users.id })`                                          | `RETURNING id`                               |
| Upsert (insert or update on conflict) | `.onConflictDoUpdate({ target: users.email, set: { name: "new" } })`    | `ON CONFLICT (email) DO UPDATE SET name=...` |
| Insert or ignore on conflict          | `.onConflictDoNothing()`                                                | `ON CONFLICT DO NOTHING`                     |
| Conflict on specific constraint       | `.onConflictDoNothing({ target: users.email })`                         | `ON CONFLICT (email) DO NOTHING`             |

```ts
const [newUser] = await db
  .insert(users)
  .values({ email: "ali@example.com", name: "Ali" })
  .onConflictDoUpdate({ target: users.email, set: { name: "Ali Updated" } })
  .returning();
```

### Update

| Plain English          | Drizzle code                                                    | SQL                                      |
| :--------------------- | :-------------------------------------------------------------- | :--------------------------------------- |
| Update matching rows   | `db.update(users).set({ name: "New" }).where(eq(users.id, id))` | `UPDATE users SET name=... WHERE id=...` |
| Update and return rows | `.returning()`                                                  | `RETURNING *`                            |
| Increment a column     | `.set({ views: sql\`${posts.views} + 1\`\` })`                  | `SET views = views + 1`                  |

### Delete

| Plain English          | Drizzle code                               | SQL                              |
| :--------------------- | :----------------------------------------- | :------------------------------- |
| Delete matching rows   | `db.delete(users).where(eq(users.id, id))` | `DELETE FROM users WHERE id=...` |
| Delete and return rows | `.returning()`                             | `RETURNING *`                    |
| Delete all rows        | `db.delete(users)`                         | `DELETE FROM users`              |

---

## 7. Relational query API (`db.query`) — nested reads

Requires passing `schema` (with relations) into `drizzle()`.

| Plain English                  | Drizzle code                                                                         |
| :----------------------------- | :----------------------------------------------------------------------------------- |
| Get all users with their posts | `db.query.users.findMany({ with: { posts: true } })`                                 |
| Get one user by condition      | `db.query.users.findFirst({ where: eq(users.id, id) })`                              |
| Select specific columns        | `db.query.users.findMany({ columns: { id: true, email: true } })`                    |
| Nested filter on relation      | `db.query.users.findMany({ with: { posts: { where: eq(posts.published, true) } } })` |
| Order + limit nested relation  | `with: { posts: { orderBy: desc(posts.createdAt), limit: 5 } }`                      |
| Deeply nested relations        | `with: { posts: { with: { comments: true } } }`                                      |

```ts
const usersWithPosts = await db.query.users.findMany({
  where: eq(users.status, "active"),
  with: {
    posts: {
      where: eq(posts.published, true),
      orderBy: desc(posts.createdAt),
    },
  },
});
```

---

## 8. Transactions

```ts
await db.transaction(async (tx) => {
  const [user] = await tx
    .insert(users)
    .values({ email: "a@b.com" })
    .returning();
  await tx.insert(posts).values({ authorId: user.id, title: "Hi" });
});
```

| Plain English                   | Drizzle code                                    |
| :------------------------------ | :---------------------------------------------- |
| Run multiple queries atomically | `db.transaction(async (tx) => { ... })`         |
| Roll back manually              | `tx.rollback()`                                 |
| Nested transaction (savepoint)  | call `tx.transaction(...)` inside a transaction |

---

## 9. Schema migrations (`drizzle-kit`)

| Plain English                                  | Command                                                                                                         |
| :--------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| Generate SQL migration from schema changes     | `npx drizzle-kit generate`                                                                                      |
| Push schema directly to DB (no migration file) | `npx drizzle-kit push`                                                                                          |
| Open Drizzle Studio (DB GUI)                   | `npx drizzle-kit studio`                                                                                        |
| Pull existing DB schema into code              | `npx drizzle-kit pull`                                                                                          |
| Check migrations are in sync                   | `npx drizzle-kit check`                                                                                         |
| Apply migrations programmatically              | `migrate(db, { migrationsFolder: "./drizzle" })` (from `drizzle-orm/node-postgres/migrator` or matching driver) |

`drizzle.config.ts` minimal shape:

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

---

## 10. Connecting the client (matches this project: Neon + node-postgres style)

```ts
// src/db/index.ts
import { drizzle } from "drizzle-orm/neon-http"; // or "drizzle-orm/node-postgres" for plain pg
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema }); // pass schema to unlock db.query.*
```

| Driver package                       | Import path                   | Use case                                   |
| :----------------------------------- | :---------------------------- | :----------------------------------------- |
| `pg` (node-postgres)                 | `drizzle-orm/node-postgres`   | Traditional Postgres server                |
| `@neondatabase/serverless` (HTTP)    | `drizzle-orm/neon-http`       | Neon, serverless/edge, no pooling          |
| `@neondatabase/serverless` (WS pool) | `drizzle-orm/neon-serverless` | Neon with pooled/transactional connections |
| `postgres` (postgres.js)             | `drizzle-orm/postgres-js`     | Fast alternative pg driver                 |
| `@vercel/postgres`                   | `drizzle-orm/vercel-postgres` | Vercel-hosted Postgres                     |

---

## 11. Type inference helpers

| Plain English                 | Drizzle code                                |
| :---------------------------- | :------------------------------------------ |
| Type of a row as read from DB | `type User = typeof users.$inferSelect;`    |
| Type of a row for inserting   | `type NewUser = typeof users.$inferInsert;` |

---

## 12. Quick reference: operators import list

```ts
import {
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  and,
  or,
  not,
  inArray,
  notInArray,
  isNull,
  isNotNull,
  like,
  ilike,
  notIlike,
  between,
  notBetween,
  exists,
  notExists,
  sql,
  asc,
  desc,
  count,
  sum,
  avg,
  min,
  max,
} from "drizzle-orm";
```

All live in `"drizzle-orm"` (not `pg-core`) — `pg-core` is only for **schema/column definitions** (`pgTable`, `varchar`, `uuid`, `pgEnum`, `index`, etc.).
