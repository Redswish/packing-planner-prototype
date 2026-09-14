---
name: packing-list-builder
description: Turn a settled trip brief into a quantified, grouped packing list. Load this after trip-interview has established where, when, how long, what luggage and who is travelling, or when the user asks for a packing list, what to bring, or a checklist of clothes and gear.
---

# Packing List Builder

You produce the list. The interview has already established the trip — don't re-open it. If a genuine essential is still missing, assume it, say so, and carry on.

Load `travel-boundaries` if you have not already. Load `seasonal-climate` if destination and timing are known and you have not loaded it yet.

The useful part is not the list, it's the reasoning behind the quantities. Show that reasoning.

## 1. Start from the baseline

Read the bundled checklist with `read_skill_resource`:

- skill: `packing-list-builder`
- path: `templates/essentials.md`

Use it as a backbone, then add, cut and adjust for this specific trip. Cut freely — an item that doesn't apply is noise.

## 2. Group in this order, always

1. **Documents & money**
2. **Clothing**
3. **Toiletries & medication**
4. **Electronics**
5. **Activity gear**
6. **What to wear on the day**

Documents come first because they're the ones that end the trip before it starts. "What to wear on the day" comes last because it's what leaves the bag — name the outfit they should travel in, including the bulky things worth wearing rather than packing.

Drop any group that's genuinely empty for this trip. Don't invent filler.

## 3. Quantify everything

Never write "socks". Every line carries a number.

Where the number isn't self-evident, show the arithmetic in the line itself:

- `- [ ] 5 t-shirts — 5 nights, no laundry`
- `- [ ] 7 pairs underwear — 6 nights + 1 spare`
- `- [ ] 2 pairs trousers — 1 per 3 days`

Rules of thumb, to be bent when the trip calls for it:

- **Tops:** nights + 1, or roughly 3–4 on rotation if laundry is available.
- **Underwear & socks:** one per day plus a spare. Cap around 7–8 on longer trips where laundry is possible.
- **Bottoms:** one per 2–3 days.
- **Shoes:** two pairs is usually right; one is worn, one is packed.

Whenever laundry access changes the count, say so on the line.

## 4. Mark what would ruin the trip

Some items are recoverable if forgotten — you can buy a toothbrush anywhere. Others end or seriously damage the trip: passport, visa documentation (as a *check*, never as advice that they need one), essential medication, house and car keys, the charger for a device they depend on, a prescription pair of glasses, tickets that can't be reissued.

Mark those with **`⚠️`** and a `— critical` note, and keep the marks scarce.

## 5. Adapt to the constraints

- **Carry-on only:** flag anything that won't clear liquid limits and say what needs a travel-sized version.
- **Backpacking / moving around:** favour things that dry fast and layer; weight matters more than variety.
- **Cold or wet:** build layers rather than one heavy item.
- **Formal or business:** name the specific outfit, including shoes and belt.
- **Children:** see below.

## 6. Multiple travellers

When more than one person is travelling:

- Give **each traveller their own list**, under their own heading — use names if you have them, otherwise "Adult 1", "Child (6)".
- Add a **Shared** section for things there's no point duplicating: first-aid kit, chargers that fit multiple devices, adapters, sunscreen, travel documents folder.
- Size the shared items to the group, not per person.
- Don't repeat the full clothing logic for each person — quantify each list, but keep the arithmetic explanation to the first one and note the differences after.
- For children, work from age: nappies and changes of clothes for a toddler, entertainment and a comfort item for a 6-year-old, their own daypack for a teenager. Always more spare clothing per day than an adult gets.

## 7. Close with notes specific to this trip

End with **two or three** short notes that only apply to *this* trip. Things like the plug type for that country, a dress code at a place they'll likely visit, a seasonal watch-out.

Two or three. Not a section, not a wall.

## Format

- Markdown headings for each group.
- Checkbox bullets: `- [ ] item — quantity/note`.
- Quantity always visible in the item text.
- Keep it scannable. No preamble before the list beyond the trip recap (or the hurry **Assumptions** block), and no summary after the closing notes.
