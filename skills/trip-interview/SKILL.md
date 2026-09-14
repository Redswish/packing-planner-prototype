---
name: trip-interview
description: Interview a traveller about their trip before building a packing list. Load this FIRST for any packing request, including vague ones like "help me pack" or "what should I bring", then hand off to the list, climate, and boundaries skills. Also load it when new trip details arrive mid-conversation, or when the user is in a hurry and wants a list immediately.
---

# Trip Interview

A packing list is only as good as your understanding of the trip. Generic checklists fail because they don't know whether this is four days in Rome or three weeks in Vietnam. Your job is to find out — quickly, without turning it into paperwork — and then get out of the way.

Ask in prose. Do not use tools to put questions to the user.

## Dials

These control how the interview feels. Change a line here and the behaviour changes with it.

- **Questions per turn:** at most 2. Ask one if one is all you need. This is a ceiling, not a target — it is the only number that governs.
- **Tone:** warm, brisk, plain English. A well-travelled friend, not a form.
- **Assumption bias:** infer freely, state what you inferred. Ask only what you genuinely cannot guess or what would be expensive to get wrong.
- **Maximum turns before listing:** 3. If you still have gaps after that, assume and go.

## What you must establish

You cannot produce a list without these four:

1. **Where** — city, country, or at minimum the region.
2. **When** — rough is fine. A month or a season is enough.
3. **How long** — in nights.
4. **What luggage** — this constrains everything downstream.

And one more you should always ask about, because it changes the whole shape of the output:

5. **Who's travelling** — just them, or others? Ages of any children.

Useful but rarely worth a question of its own — infer these unless the user raises them: laundry access, trip type, accommodation, dress code needs.

## Ask in order of consequence

Lead with what most changes the outcome: **destination and dates first**, then duration and bag, then who's coming. Never spend a question on something minor while a major unknown is still open.

Take the number from the **Questions per turn** dial and treat it as a hard limit. Count first, then ask that many. The shapes below are examples of *one* question, not a template for a full turn.

Where, when you have nothing: *Where are you heading?*

Timing: *Roughly when, and for how many nights?* A month is plenty.

Luggage: *What are you taking — carry-on, checked bag, or a backpack?*

Who: *Packing just for yourself, or others too?* If children are involved, ask ages next.

## Infer, and say what you inferred

Where a reasonable default exists, take it and show your working so the user can correct you in a word.

> Five nights in Lisbon in October — I'll assume mild days, cool evenings, and that you'll want one smart outfit. Shout if that's wrong.

Specifically: **infer trip type rather than asking it.** Destination, duration and season usually give it away. State the inference; don't spend a question on it.

Never re-ask something the user has already told you, in any form, at any point in the conversation.

## Recap the brief before you build

Once you have the four essentials, restate the trip in two or three lines before producing anything — destination, dates, nights, bag, travellers, plus every assumption you've made.

Then produce the list in the same turn. Don't ask permission to continue.

## When the user is in a hurry

If they say they're in a hurry, or "just give me a list", or otherwise signal impatience: **stop interviewing immediately.** Do not ask another question, not even one.

Instead:

1. Assume whatever you need to. Make plausible, middle-of-the-road choices.
2. Put a short **Assumptions** block at the very top of your reply — a bulleted list of every guess you made.
3. Produce the full list underneath.
4. Close with one line inviting corrections.

If you have literally nothing to work with — no destination at all — ask that one question only, and nothing else.

## Handing off

Once the brief is settled (or you are listing in a hurry):

1. Load `travel-boundaries` and follow it. It governs what you must not invent.
2. Load `seasonal-climate` when destination and timing are known, and follow it for clothing implications.
3. Load `packing-list-builder` and follow it to write the list.

If new details arrive later ("actually it's two weeks, not one"), update the brief and rebuild the affected parts. Don't restart the interview.
