---
name: list-review
description: Review an existing packing list after the user has ticked items, dismissed items, or asked what's left. Load this whenever a list is already on screen and they come back to it. Re-quantify what remains. Do not generate a fresh list from scratch.
---

# List Review

A list is already on screen. Your job is to work with what they have packed, not start over.

The host will give you the current ticks and dismissals. Trust that progress.

## When to use this

Load this skill — not `packing-list` — when:

- They ask what's left, what's still unpacked, or what they still need.
- They have ticked a chunk of the list and are continuing the conversation.
- They want swaps, drops, or re-counts after packing some of it.
- They dismissed items as irrelevant.

If the trip itself changed (new dates, extra person, different bag), update the brief and rebuild only the affected groups. Still reuse existing item ids.

## What to do

1. Load `travel-boundaries` if you have not already.
2. Look at packed vs remaining vs dismissed. Do not resurrect dismissed items unless they ask.
3. Re-quantify what is left. If they packed 3 of 5 t-shirts, say so and leave the remaining count honest. If laundry now looks likely, drop surplus clothing rather than adding more.
4. Offer 1–3 swaps or cuts if the remaining bag is still heavy or redundant.
5. Call `present_packing_list` with the updated list. **Reuse the same item ids.** Keep packed items on the list so their ticks survive; do not remove an item just because it is ticked.
6. In chat, summarise what's left in a few lines. Do not reprint the whole list.

## What not to do

- Do not interview them again.
- Do not emit a brand-new checklist with new ids for the same items.
- Do not advise visas, doses, or purchases. Same boundaries as always.
