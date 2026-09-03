# FPL API Reference

Base URL: `https://fantasy.premierleague.com/api`

Public, unauthenticated, JSON. No API key. Every endpoint below was verified live (all `200`).

The site URL `…/en/entry/7616704/event/2` is only the UI page — the data behind it is
`…/api/entry/7616704/event/2/picks/`. Trailing slashes matter; omitting one gives a redirect.

> **No CORS headers.** These cannot be called from a client component. All calls must go through
> the server — an RSC, a route handler, or a tRPC procedure.

---

## Endpoints

### Global / reference data

| Endpoint | Size | Returns |
|---|---|---|
| `/bootstrap-static/` | ~1.7 MB | The master payload. Keys: `elements` (651 players), `teams` (20), `events` (38 gameweeks), `element_types` (positions), `element_stats`, `chips`, `phases`, `game_settings`, `game_config`, `total_players` |
| `/fixtures/` | large | All 380 fixtures. Filter with `?event={gw}` (returns 10) |
| `/event-status/` | tiny | Per-day bonus/points state for the current GW + whether league tables have updated |
| `/team/set-piece-notes/` | ~2 KB | Penalty / free-kick / corner takers per club |
| `/dream-team/{gw}/` | ~0.5 KB | Best XI of the gameweek + `top_player` |
| `/element-summary/{playerId}/` | ~13 KB | One player's full record: `history` (per-GW this season), `fixtures` (upcoming, with `difficulty`), `history_past` (prior seasons) |

### Manager ("entry") data

| Endpoint | Returns |
|---|---|
| `/entry/{entryId}/` | Profile: `player_first_name`, `player_last_name`, `name` (team name), `summary_overall_points`, `summary_overall_rank`, `current_event`, `leagues`, `last_deadline_value`, `last_deadline_bank`, `club_badge_src` |
| `/entry/{entryId}/event/{gw}/picks/` | **The main one.** `picks` (15), `entry_history`, `active_chip`, `automatic_subs` |
| `/entry/{entryId}/history/` | `current` (per-GW rows this season), `past` (prior seasons), `chips` (name + gw + timestamp) |
| `/entry/{entryId}/transfers/` | Flat array of every transfer made this season (`[]` if none) |

### Leagues

| Endpoint | Returns |
|---|---|
| `/leagues-classic/{leagueId}/standings/?page_standings=1` | `league` (metadata), `standings.results` (50/page), `standings.has_next`, `new_entries` |
| `/leagues-h2h/{leagueId}/standings/?page_standings=1` | Same shape for head-to-head leagues |

League `314` is the global "Overall" league — useful for testing.

---

## Response shapes worth knowing

### `/entry/{id}/event/{gw}/picks/`

```jsonc
{
  "active_chip": "bboost",        // null | "bboost" | "3xc" | "freehit" | "wildcard" | "manager"
  "automatic_subs": [],           // auto-subs applied after the GW finishes
  "entry_history": {
    "event": 2, "points": 99, "total_points": 146,
    "rank": 1737185, "overall_rank": 2439660, "percentile_rank": 20,
    "bank": 5, "value": 1001,     // ×10 → £0.5m in bank, £100.1m squad value
    "event_transfers": 0, "event_transfers_cost": 0,
    "points_on_bench": 0
  },
  "picks": [
    { "element": 411, "position": 11, "multiplier": 2,
      "is_captain": true, "is_vice_captain": false, "element_type": 4 }
  ]
}
```

`position` 1–11 is the starting XI, 12–15 the bench (in sub order).

`multiplier` encodes all the chip logic — use it directly rather than special-casing:

| Value | Meaning |
|---|---|
| `0` | Benched, did not play |
| `1` | Starter (or **any** bench player under Bench Boost) |
| `2` | Captain |
| `3` | Triple Captain |

### `/bootstrap-static/` → `elements[]`

The fields that matter most:

```jsonc
{
  "id": 411, "web_name": "Haaland",
  "first_name": "Erling", "second_name": "Haaland",
  "team": 15,                    // → join teams[].id
  "element_type": 4,             // → join element_types[].id
  "now_cost": 155,               // ×10 → £15.5m
  "total_points": 15, "form": "7.5", "ep_next": "7.5",
  "selected_by_percent": "70.9",
  "status": "a",                 // a=available, d=doubtful, i=injured, s=suspended, u=unavailable, n=not in squad
  "news": "",                    // injury / availability text, empty when fine
  "minutes": 180, "expected_goals": "1.40"
}
```

`element_types[]` gives `singular_name_short`: `1`=GKP, `2`=DEF, `3`=MID, `4`=FWD.

`teams[]` carries `short_name`, `strength`, and the six directional ratings
(`strength_attack_home`, `strength_defence_away`, …) — these are what fixture-difficulty models use.

`events[]` gives per-GW context: `deadline_time`, `is_current` / `is_next` / `is_previous`,
`finished`, `data_checked`, `average_entry_score`, `highest_score`, `most_captained`,
`most_transferred_in`, `chip_plays`.

### `/event/{gw}/live/`

```jsonc
{ "elements": [ { "id": 1, "stats": { "total_points": 2, "minutes": 90, "bonus": 0, "bps": 18, … }, "explain": [...] } ] }
```

`stats` carries the full breakdown — goals, assists, clean sheets, saves, cards, `bps`,
`defensive_contribution`, plus expected stats (`expected_goals`, `expected_assists`).

### `/entry/{id}/history/`

```jsonc
{
  "current": [ { "event": 1, "points": 47, "total_points": 47, "overall_rank": …, "bank": …, "value": …, "points_on_bench": … } ],
  "past":    [ { "season_name": "2024/25", "total_points": …, "rank": … } ],
  "chips":   [ { "name": "bboost", "event": 2, "time": "2026-08-28T17:26:29Z" } ]
}
```

### `/leagues-classic/{id}/standings/`

```jsonc
{
  "league": { "id": 314, "name": "Overall", "league_type": "s", "scoring": "c", … },
  "standings": {
    "has_next": true, "page": 1,
    "results": [ { "entry": 7616704, "entry_name": "…", "player_name": "…",
                   "rank": 1, "last_rank": 3, "event_total": 99, "total": 146 } ]
  }
}
```

Page with `?page_standings=2`, `3`, … while `has_next` is true.

---

## Gotchas

1. **Picks are IDs only.** `{"element": 411}` — no name, no points. Every useful view needs a join:
   `picks.element` → `bootstrap-static.elements[].id` (identity, price, position) and
   → `event/{gw}/live/.elements[].id` (what they actually scored).

2. **All money is ×10.** `now_cost: 155` = £15.5m. Same for `bank`, `value`, `last_deadline_value`.

3. **Bonus points arrive late.** During and just after matches, `live` totals exclude bonus.
   Check `/event-status/` → `status[].bonus_added` before treating a GW score as final.

4. **`bootstrap-static` is 1.7 MB.** Do not fetch it per request. It changes roughly daily
   (prices update ~01:30 UTC), so cache it hard.

5. **Cloudflare.** FPL sits behind Cloudflare and can `403` requests from datacenter IPs even
   though localhost works fine. If that bites on deploy, the fix is a scheduled sync into Neon
   Postgres rather than a live proxy — which the 1.7 MB payload argues for anyway.

---

## Suggested cache windows

| Data | Revalidate | Why |
|---|---|---|
| `bootstrap-static` | 1 hour (or daily sync to DB) | Huge; changes ~once a day |
| `event/{gw}/live` | 60 s | Moves constantly during matches |
| `entry/{id}/picks` | 5 min | Frozen after the deadline |
| `entry/{id}/`, `history` | 5 min | Updates once per GW |
| `fixtures` | 1 hour | Rarely changes mid-week |
| League standings | 15 min | Recalculated once per GW |
| `set-piece-notes` | 1 day | Editorial, updated occasionally |

---

## Common entry points

```
/bootstrap-static/
/entry/7616704/
/entry/7616704/event/2/picks/
/entry/7616704/history/
/entry/7616704/transfers/
/event/2/live/
/fixtures/?event=2
/element-summary/411/
/leagues-classic/314/standings/?page_standings=1
/event-status/
/team/set-piece-notes/
/dream-team/2/
```
