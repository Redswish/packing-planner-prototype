# Trip Packing Planner

A conversational packing assistant. It interviews you about your trip, then
produces a tailored, quantified packing list.

Built as a local Next.js + TypeScript prototype whose **behaviour comes entirely
from Agent Skills** (the [agentskills.io](https://agentskills.io) standard). The
application code is a generic harness — it knows how to find and load skills,
but nothing about packing, travel, or what to ask. Everything the assistant
actually does lives in `skills/*/SKILL.md`.

> Editing a `SKILL.md` file is the only way to change the agent's behaviour.

## How it works

Skills load in two stages:

1. **At startup** the server scans `skills/` and reads only the YAML frontmatter
   (`name` + `description`) of each `SKILL.md`. Those pairs go into the system
   prompt so the model knows what exists.
2. **On demand** the model calls `load_skill` to pull in one skill's full
   instructions — and `read_skill_resource` to read any files it bundles.

Each assistant reply shows a badge for every skill it opened.

## The skills

| Skill | Role |
| --- | --- |
| `trip-interview` | Owns the conversation. Dials for question count and tone, the hurry escape hatch, then hands off. |
| `travel-boundaries` | What not to answer (forecasts, visas, medication, unsolicited buying). |
| `seasonal-climate` | Seasonal norms → clothing implications. Never a live forecast. |
| `packing-list-builder` | Grouped, quantified list. Bundles `templates/essentials.md`. |

Change **Questions per turn** in `skills/trip-interview/SKILL.md` and send a new
message. No restart, no code.

## Running it

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the env file and add a [Vercel AI Gateway](https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai-gateway%2Fapi-keys) key:

   ```bash
   cp .env.example .env.local
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

The model is `anthropic/claude-sonnet-5`, set in `src/lib/agent.ts`.

## Scope

No auth, no database, no streaming, no tests. Transcripts live in the browser
session only.
