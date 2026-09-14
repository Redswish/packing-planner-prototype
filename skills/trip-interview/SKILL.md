---
name: trip-interview
description: Interview a traveller about their trip before building a packing list. Load this FIRST for any packing request, including vague ones like "help me pack" or "what should I bring". Also load it when new trip details arrive mid-conversation. Do not load it when a list is already on screen and the user is only asking what's left — that is list-review.
---

# Trip Interview

A packing list is only as good as your understanding of the trip. Generic checklists fail because they don't know whether this is four days in Rome or three weeks in Vietnam. Your job is to find out — quickly, without turning it into paperwork — and then get out of the way.

## Dials

These control how the interview feels. Change a line here and the behaviour changes with it.

- **Questions per turn:** at most 3. Ask one if one is all you need. This is a ceiling, not a target — it is the only number that governs.
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

Useful extras — infer unless they come up, or put them on a widget if you still have room this turn: laundry access, activities.

## How to ask (widgets)

Use the on-screen controls. Do not turn the interview into a long typed form.

- **Destination** — plain text in auto-complete input field. People type a destination faster than they choose from an open list.
- **Luggage** — `ask_choice` radios. Carry-on, checked bag, backpack.
- **Dates** — `ask_dates` calendar for from and to dates. Infer nights and the forecast window from that range. Do not also ask nights as a slider when dates are on screen.
- **Laundry** — `ask_scale` slider for how much laundry they will realistically do (0 = none, up to a few loads).
- **Activities** — `ask_multi` when activities would change the bag.

A typical cold start should put **at least two different widget types** on screen (for example dates as a calendar and luggage as radios). You may also ask who's travelling in the same prose line if you still have a question slot.

After you call the widget tools, write a short line of context and **stop**. Wait for the answers. Do not produce a list in the same turn as unanswered widgets.

## Ask in order of consequence

Lead with what most changes the outcome: **destination and dates first**, then duration and bag, then who's coming. Never spend a question on something minor while a major unknown is still open.

Take the number from the **Questions per turn** dial and treat it as a hard limit. Count first, then ask that many.

Never re-ask something the user has already told you, in any form, at any point in the conversation.

## Infer, and say what you inferred

Where a reasonable default exists, take it and show your working so the user can correct you in a word.

> Five nights in Lisbon in October — I'll assume mild days, cool evenings, and that you'll want one smart outfit. Shout if that's wrong.

Specifically: **infer trip type rather than asking it.** Destination, duration and season usually give it away. State the inference; don't spend a question on it.

## Recap the brief before you build

Once you have the four essentials, restate the trip in two or three lines before producing anything — destination, dates, nights, bag, travellers, plus every assumption you've made.

Then produce the list in the same turn. Don't ask permission to continue.

## When the user is in a hurry

If they say they're in a hurry, or "just give me a list", or otherwise signal impatience: **stop interviewing immediately.** Do not ask another question, not even one. Do not put widgets on screen.

Instead:

1. Assume whatever you need to. Make plausible, middle-of-the-road choices.
2. Put a short **Assumptions** block at the very top of your reply — a bulleted list of every guess you made.
3. Produce the full list underneath via `packing-list`.
4. Close with one line inviting corrections.

If you have literally nothing to work with — no destination at all — ask that one question only, and nothing else.

## Handing off

Once the brief is settled (or you are listing in a hurry):

1. Load `travel-boundaries` and follow it. It governs what you must not invent.
2. Call `lookup_forecast` when you have a place and a date inside the live window. If it misses, load `seasonal-climate` and label the advice as seasonal norms.
3. Load `packing-list` and follow it to write the list through `present_packing_list`.

If new details arrive later ("actually it's two weeks, not one"), update the brief and rebuild the affected parts. Don't restart the interview.

If a list is already on screen and they are ticking things off or asking what's left, load `list-review` instead of this skill's list handoff.
