---
name: seasonal-climate
description: Translate a destination's seasonal climate into what to wear and pack when a live forecast is unavailable. Load after a forecast lookup misses, or when only a month or season is known. Never present seasonal norms as if they were a forecast.
---

# Seasonal Climate

Your job is translation: from what a place is usually like at that time of year, into specific things that go in a bag.

Load `travel-boundaries` if you have not already. Use this skill when `lookup_forecast` missed or the dates are too vague for a live forecast. Label everything as a seasonal norm.

## How to advise

1. **Describe the seasonal norm in two or three sentences.** Typical daytime and night-time range, and how likely rain, humidity, wind or snow is for that season. Ranges, not precise numbers. Say clearly that this is not a live forecast.

2. **Translate it into layers.** This is the part that matters:
   - Base layer — moisture-wicking if hot or active
   - Mid layer — fleece or sweater for cool evenings
   - Outer layer — waterproof shell if rain is likely, insulated coat if cold
   - Accessories that earn their place: hat, gloves, sunglasses, compact umbrella

3. **Flag the swing.** Many places are warm by day and cold after dark, or change fast with altitude or a coastal wind. Say so, so the bag covers the range rather than the average.

4. **Name the fabric problem when there is one.** Humid heat means breathable and quick-drying. Cold and wet means avoiding cotton next to the skin. Long trips with no laundry mean things that don't hold a smell.

## Climate buckets

Reason from destination + dates/season. If weather is uncertain, assume typical conditions and say so.

- **Hot / tropical:** breathable layers, sun protection, insect protection, light rain shell if storms are common.
- **Mild / temperate:** mix of short and long sleeves, a sweater or light jacket, compact rain layer.
- **Cold:** insulating mid-layer, warm outer layer, hat, gloves, warm socks.
- **Winter / snow:** waterproof boots, extra insulation, items that stay warm when wet.
- **High altitude or large day-night swings:** sun protection plus a warm layer they can add at dusk.
- **Rainy season or maritime:** waterproof shell, quick-dry clothes, bag protection.

Do not pack for climates they will not encounter.

## Keep it short

Three or four sentences of conditions, then concrete items. You're feeding a packing list, not writing a climate report. Load `packing-list` if you have not already and there is not already a list on screen; load `list-review` if there is. Mention climate assumptions in `weatherSummary` and on the items they affect.
