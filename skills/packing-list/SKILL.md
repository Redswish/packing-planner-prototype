---
name: packing-list
description: Produce the first tailored packing list once the trip brief is known, or immediately when the user wants a list now. Load after trip-interview has the minimum (where, when, how long, bag, who), or when they say "just give me a list". Do not load this when a list is already on screen and they only want to review what's left — that is list-review.
---

# Packing List

You produce the list. The interview has already established the trip — don't re-open it. If a genuine essential is still missing, assume it, say so, and carry on.

Load `travel-boundaries` if you have not already. Call `lookup_forecast` when destination and dates are concrete. If the forecast tool misses, load `seasonal-climate` and label those conditions as seasonal norms, not a forecast.

The useful part is not the list, it's the reasoning behind the quantities. Show that reasoning on the item.

## 1. Start from the baseline

Read the bundled checklist with `read_skill_resource`:

- skill: `packing-list`
- path: `templates/essentials.md`

Use it as a backbone, then add, cut and adjust for this specific trip. Cut freely — an item that doesn't apply is noise.

## 2. Put it on screen with the tool

You MUST call `present_packing_list`. That is the list. Do not write checkbox markdown in chat.

- Reuse stable item `id`s if you are updating an existing list.
- `owner` is the traveller's name, or `shared`.
- `group` must be one of: `documents`, `clothing`, `toiletries`, `electronics`, `activity`, `wear-on-day`.
- `quantity` is required on every item. Never just "socks".
- `rationale` is where you show the maths when it isn't obvious: `"5 nights, no laundry"`.
- `critical` only for things that would actually ruin the trip if forgotten.
- `weatherNote` on clothing and gear that depends on the forecast or seasonal norm. Reference the weather there, not only in the preface.
- `notes` — two or three trip-specific lines (plug type, dress code, a weather watch-out). Not a section, not a wall.
- `weatherSummary` — one or two sentences. If you used a live forecast, say so. If you used seasonal norms, say so.

Chat can hold a short recap. The module is the source of truth.

## 3. Group in this order, always

1. **Documents & money** (`documents`)
2. **Clothing** (`clothing`)
3. **Toiletries & medication** (`toiletries`)
4. **Electronics** (`electronics`)
5. **Activity gear** (`activity`)
6. **What to wear on the day** (`wear-on-day`)

Documents come first because they're the ones that end the trip before it starts. "What to wear on the day" comes last because it's what leaves the bag — name the outfit they should travel in, including the bulky things worth wearing rather than packing.

Drop any group that's genuinely empty for this trip. Don't invent filler.

## 4. Quantify everything

Rules of thumb, to be bent when the trip calls for it:

- **Tops:** nights + 1, or roughly 3–4 on rotation if laundry is available.
- **Underwear & socks:** one per day plus a spare. Cap around 7–8 on longer trips where laundry is possible.
- **Bottoms:** one per 2–3 days.
- **Shoes:** two pairs is usually right; one is worn, one is packed.

Whenever laundry access changes the count, say so in `rationale`.

## 5. Mark what would ruin the trip

Some items are recoverable if forgotten — you can buy a toothbrush anywhere. Others end or seriously damage the trip: passport, visa documentation (as a *check*, never as advice that they need one), essential medication, house and car keys, the charger for a device they depend on, a prescription pair of glasses, tickets that can't be reissued.

Set `critical: true` on those, and keep the marks scarce.

## 6. Adapt to the constraints

- **Carry-on only:** flag anything that won't clear liquid limits and say what needs a travel-sized version.
- **Backpacking / moving around:** favour things that dry fast and layer; weight matters more than variety.
- **Cold or wet:** build layers rather than one heavy item.
- **Formal or business:** name the specific outfit, including shoes and belt.
- **Children:** see below.

## 7. Multiple travellers

When more than one person is travelling:

- Give **each traveller their own items**, with `owner` set to their name — or "Adult 1", "Child (6)" if you have no name.
- Add **shared** items (`owner: "shared"`) for things there's no point duplicating: first-aid kit, chargers that fit multiple devices, adapters, sunscreen, travel documents folder.
- Size the shared items to the group, not per person.
- Don't repeat the full clothing logic for each person — quantify each list, but keep the arithmetic explanation to the first one and note the differences after.
- For children, work from age: nappies and changes of clothes for a toddler, entertainment and a comfort item for a 6-year-old, their own daypack for a teenager. Always more spare clothing per day than an adult gets.

## 8. Close

Two or three notes in `notes`. Then stop. Invite corrections in one chat line if you assumed anything.
