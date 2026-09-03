# Claude Code — Tool Usage Suggestions for Bullseye FPL

> **How to read this file:** each entry states a **Context** (a real situation in this project),
> then the **Tool** to reach for, then **Usage** (exactly how to invoke it).
> This is a living document — append as new contexts appear.

---

## 0. Foundation — set these up once, benefit forever

### 0.1 Context: I forget architectural decisions between sessions. Claude also starts every session blind.

**Tool:** `CLAUDE.md` (project memory file) + the `/init` skill

**Usage:**

- Run `/init` once — Claude scans the repo and drafts a `CLAUDE.md` at the project root.
- Then hand-edit it to encode the **non-negotiables** from `.private/Requirement.md`:
  - Dual-repo (no monorepo), no Docker, no JWTs (DB sessions only)
  - Direct Read Path: Next.js → tRPC → Drizzle → Postgres. Python never serves the frontend.
  - `pnpm` only, `src/` layout, `@/*` → `src/*`
- `CLAUDE.md` is auto-loaded into **every** session. Anything you'd have to re-explain belongs here.
- Quick-add during a session: type `#` followed by the fact — Claude offers to write it into `CLAUDE.md`.
- Keep it short. It costs context tokens on every single request. Rules, not prose.

> ⚠️ Your current `claude.md` (lowercase) at root is **empty**. Rename to `CLAUDE.md` and fill it.
---

### 0.2 Context: Secrets. `.env.local` has live Neon credentials and `BETTER_AUTH_SECRET`.

**Tool:** `.claude/settings.json` → `permissions.deny`

**Usage:**

```jsonc
// .claude/settings.json  (commit this — it has no secrets in it)
{
  "permissions": {
    "deny": ["Read(./.env*)", "Read(./.private/**)"]
  }
}
```

Ask Claude: _"use the update-config skill to deny reads on .env\* and .private/"_ — the
`update-config` skill knows the exact schema and won't corrupt your settings file.

---

### 0.3 Context: I approve the same commands over and over (`pnpm build`, `git status`, `pnpm tsc`).

**Tool:** `/fewer-permission-prompts` skill, and `/permissions`

**Usage:**

- Run `/fewer-permission-prompts` — it reads your past transcripts and proposes an allowlist of
  safe, read-only commands for `.claude/settings.json`.
- Or `/permissions` to edit interactively.
- Never allowlist `Bash(pnpm drizzle-kit push:*)` — that mutates your production Neon DB. Keep it prompting.

---

## 1. Getting oriented after a long break

### 1.1 Context: "I haven't touched this in months. Where did I leave off?"

**Tool:** the `Explore` subagent

**Usage:**

```
Use the Explore agent to map every tRPC procedure, Drizzle table, and route in src/,
and list which ones are wired up vs. defined-but-unused. Search breadth: very thorough.
```

**Why a subagent:** Explore reads dozens of files and returns only the conclusion. Doing it in
your main session would flood your context window with file dumps you'll never re-read.

**Don't** use it for: reading 3 files you already know the paths to. That's just `Read`.

---

### 1.2 Context: Is the repo actually in a working state right now?

**Tool:** plain `Bash` — but ask Claude to run them in **parallel**

**Usage:** _"run tsc --noEmit, pnpm lint, and git status in parallel and summarize"_

Independent commands issued in one message run concurrently. Each round-trip re-sends the whole
conversation, so batching cuts both time and cost.

---

## 2. Building the app (Phase 3+)

### 2.1 Context: Big feature, many files, and I want to approve the approach before any code is written.

**Tool:** **Plan mode**

**Usage:** Press `Shift+Tab` to cycle modes until you see _plan mode_. Claude can read and search
but **cannot edit** until you approve a written plan.

Use it for: the Black Box schema design, the Redis live-path wiring, the Python↔Postgres contract.
Skip it for: "add a Navbar link."

---

### 2.2 Context: I want a second architectural opinion before committing to a design.

**Tool:** the `Plan` subagent

**Usage:**

```
Use the Plan agent: design the Drizzle schema for players, teams, fixtures, and
calculated_stats, given that a Python worker overwrites calculated_stats on a cron
and Next.js only ever reads it. Return trade-offs on indexing and partial updates.
```

Returns a step-by-step plan and names the critical files. Read-only — it can't touch your code.

---

### 2.3 Context: `pnpm dev` needs to stay running while I keep working.

**Tool:** background Bash

**Usage:** _"start the dev server in the background"_ — Claude passes `run_in_background: true`.
The process survives across turns and Claude is notified when it exits. In interactive mode you
can also press `Ctrl+B` to background a running command.

**Anti-pattern:** never ask Claude to `sleep 30` and poll. It's blocked, and it burns turns.

---

### 2.4 Context: "Does the FPL pitch view actually render correctly?"

**Tool:** the `/run` skill

**Usage:** `/run` — launches the app the way this project expects, and can screenshot the result.
Better than "it typechecks, ship it," especially for the pitch view and radar chart.

---

### 2.5 Context: I have a Figma mockup of the pitch / player card.

**Tool:** the Figma MCP server (already connected to this session)

**Usage:** Paste the `figma.com` URL and say _"implement this as a React component using our
Shadcn setup."_ Claude loads the `/figma-use` skill first, then `get_design_context` /
`get_screenshot` to read the actual frame rather than guessing.

Also works in reverse — push a built page **into** Figma once your design system stabilizes.

---

### 2.6 Context: I want to try a risky refactor without wrecking my working tree.

**Tool:** git worktree isolation (`EnterWorktree`), or checkpoints

**Usage:**

- _"do this in a worktree"_ — Claude works on an isolated copy of the repo; discarded automatically if unchanged.
- Or press `Esc Esc` to **rewind** to an earlier checkpoint in the session if an edit went wrong.

---

## 3. Code quality & security

### 3.1 Context: I've built a feature and want it checked before merging.

**Tool:** `/code-review`

**Usage:**

- `/code-review` — reviews the current diff for correctness bugs + simplification wins.
- `/code-review high` — broader coverage, more findings, some speculative.
- `/code-review ultra` — deep multi-agent review in the cloud. **Billed, and you must trigger it
  yourself** — Claude cannot launch it for you.
- `/code-review --fix` — applies the findings to your working tree.

---

### 3.2 Context: I'm about to expose public endpoints — FPL team import, the Python REST bridge, AdSense pages.

**Tool:** `/security-review`

**Usage:** Run it on the branch before every deploy that touches auth, `api/`, or anything that
accepts a user-supplied FPL ID. Specifically valuable for you because: unauthenticated tRPC
mutations, SSRF risk on the FPL-ID import path, and rate-limiting gaps.

---

### 3.3 Context: The code works but reads badly / duplicates existing helpers.

**Tool:** `/simplify`

**Usage:** `/simplify` — quality-only pass (reuse, dead code, altitude). It does **not** hunt bugs;
that's `/code-review`.

---

## 4. Data, crawling, and the Python worker

### 4.1 Context: I need to find Understat's hidden JSON endpoint, or check the current FPL API shape.

**Tool:** `WebFetch` + `WebSearch`

**Usage:** _"fetch https://fantasy.premierleague.com/api/bootstrap-static/ and infer a Drizzle
schema for the players and teams arrays."_

This is genuinely high-leverage: instead of you hand-typing 40 columns, Claude reads the live
payload and generates the schema + Zod validators.

---

### 4.2 Context: Serious, structured crawling for the Intelligence Hub (journalist reports, rumours).

**Tool:** the **Firecrawl MCP server**

**Usage:** ⚠️ Currently **connected but not authorized** in this session. Authorize it in your
claude.ai connector settings first — until then its tools are unavailable.

Once live: Firecrawl handles JS-rendered pages and returns clean markdown, which is far more
robust than DIY `httpx` + regex for news sites (Understat's JSON endpoint stays `httpx`).

---

### 4.3 Context: The Python worker lives in a **separate repo** (`bullseye-fpl-worker`).

**Tool:** a second Claude Code session, in that repo's directory

**Usage:** Claude Code is directory-scoped. Open a terminal in the worker repo and run `claude`
there, with its own `CLAUDE.md`. Do **not** try to make one session span both repos — that
defeats the whole point of your dual-repo constraint.

If you need them to coordinate, `ListAgents` + `SendMessage` can talk to another local session.

---

### 4.4 Context: Scheduled work — nightly scrape health checks, price-change monitoring, GW deadline reminders.

**Tool:** the `/schedule` skill (cloud routines) — and `/loop` for short-lived polling

**Usage:**

- `/schedule` — creates a cron-scheduled **cloud** agent. Good for: "every morning at 6am, check
  whether last night's GitHub Action scrape wrote fresh rows to `calculated_stats`, and open an
  issue if not."
- `/loop 10m /check-live-feed` — repeats a command on an interval within a session. Good for
  matchday babysitting.

These are **not** a replacement for your GitHub Actions cron. GH Actions runs the scrape; the
routine watches whether the scrape is healthy.

---

## 5. AI features (chat engine, assistant) — your stated next frontier

### 5.1 Context: Before writing a single line of Anthropic API code.

**Tool:** the `claude-api` skill

**Usage:** It loads current model IDs, pricing, streaming, tool-use, prompt-caching, and token
counting. **Do not let Claude answer from memory** on model names or pricing — it will confidently
give you a stale model ID. Say _"load the claude-api skill first"_ or just mention Claude/Anthropic
and it triggers automatically.

Directly relevant to you:

- **Prompt caching** — if your FPL assistant injects a 30k-token player dataset into every prompt,
  caching that prefix cuts cost by ~90%. This is the single biggest lever on your "self-sustaining"
  economics.
- **Tool use** — your assistant should *call* `player.getAll` / `transfer.getSuggestions`, not have
  stats stuffed into its prompt.

---

### 5.2 Context: I want a repeatable "how we build an AI feature here" process.

**Tool:** a custom **skill** (`.claude/skills/<name>/SKILL.md`)

**Usage:** Write your own skill encoding your conventions (which model, streaming pattern, error
handling, where prompts live). Then `/your-skill-name` loads it on demand. Skills cost zero context
until invoked — unlike `CLAUDE.md`, which is always loaded.

Good candidates for this project: `/new-trpc-router`, `/new-drizzle-table`, `/blackbox-formula`.

---

### 5.3 Context: A repetitive prompt I retype constantly.

**Tool:** custom slash commands (`.claude/commands/<name>.md`)

**Usage:** Drop a markdown file with the prompt body; invoke as `/<filename>`. Lighter than a
skill — use it when it's just a prompt, not a procedure.

---

## 6. Automation & guardrails

### 6.1 Context: "Every time you edit a `.ts` file, run Prettier / typecheck."

**Tool:** **hooks** in `.claude/settings.json`

**Usage:** Hooks are executed by the harness, not by Claude — so unlike a `CLAUDE.md` rule, they
**cannot be forgotten or ignored**. Ask: _"use the update-config skill to add a PostToolUse hook
that runs prettier on edited ts/tsx files."_

Key insight: any instruction phrased as _"from now on, whenever X, do Y"_ belongs in a hook, not
in memory.

---

### 6.2 Context: PR review on GitHub, without opening a terminal.

**Tool:** `/install-github-app`

**Usage:** Installs the Claude Code GitHub Action so Claude reviews PRs and responds to `@claude`
mentions in issues. Worth it once the worker repo and web repo are both active and you're
merging real branches.

---

## 7. Session hygiene (cost & context control)

### 7.1 Context: Long session, context filling up, responses getting slower.

**Tools:** `/compact`, `/clear`, `--continue` / `--resume`

**Usage:**

- `/compact` — summarizes the conversation so far and keeps working. Use mid-task.
- `/clear` — wipes context entirely. Use **between** unrelated tasks. Cheapest habit you can build.
- `claude --continue` resumes your last session; `claude --resume` lets you pick one.

---

### 7.2 Context: I want faster iteration on a simple task.

**Tool:** `/fast`

**Usage:** Toggles fast mode — same Opus model, faster output. Not a downgrade to a smaller model.

---

### 7.3 Context: Referencing files without pasting them.

**Tool:** `@` file mentions

**Usage:** Type `@src/server/db/schema.ts` in your prompt. Also: paste screenshots directly into
the terminal — very useful for "this pitch view looks wrong, here's a screenshot."

---

## Quick reference — what to reach for

| Situation                                | Tool                        |
| ---------------------------------------- | --------------------------- |
| "Where is X in this codebase?"            | `Explore` agent             |
| "How should I build X?"                   | Plan mode / `Plan` agent    |
| "Is this code correct?"                   | `/code-review`              |
| "Is this code safe?"                      | `/security-review`          |
| "Is this code ugly?"                      | `/simplify`                 |
| "Does it actually run?"                   | `/run`                      |
| "What's the current Claude model/price?"  | `claude-api` skill          |
| "Always do X after Y"                     | hook in `settings.json`     |
| "Remember this about the project"         | `CLAUDE.md`                 |
| "My repeatable workflow"                  | custom skill                |
| "Read this live web data"                 | `WebFetch` / Firecrawl MCP  |
| "Run this on a schedule"                  | `/schedule`                 |

---

## Anti-patterns for this project

- ❌ **Don't** spawn subagents for small tasks. Each one starts cold and re-derives context you
  already have. Reserve them for genuine fan-out searches.
- ❌ **Don't** let Claude run `drizzle-kit push` unattended — it mutates your live Neon database.
  Generate migrations and review the SQL.
- ❌ **Don't** put the Black Box formulas in `CLAUDE.md`. It's committed to git; the algorithm is
  your differentiator. Keep it in `.private/` (already gitignored) or the worker repo.
- ❌ **Don't** ask Claude for model IDs or API pricing from memory. Always via the `claude-api` skill.
