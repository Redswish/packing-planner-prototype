export const PACKING_GROUPS = [
  { id: "documents", label: "Documents & money" },
  { id: "clothing", label: "Clothing" },
  { id: "toiletries", label: "Toiletries & medication" },
  { id: "electronics", label: "Electronics" },
  { id: "activity", label: "Activity gear" },
  { id: "wear-on-day", label: "What to wear on the day" },
] as const;

export type PackingGroupId = (typeof PACKING_GROUPS)[number]["id"];

export interface WidgetOption {
  value: string;
  label: string;
}

export interface ChoiceWidget {
  type: "choice";
  id: string;
  question: string;
  options: WidgetOption[];
}

export interface ScaleWidget {
  type: "scale";
  id: string;
  question: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  defaultValue?: number;
}

export interface MultiWidget {
  type: "multi";
  id: string;
  question: string;
  options: WidgetOption[];
}

export interface DatesWidget {
  type: "dates";
  id: string;
  question: string;
}

export type InterviewWidget =
  | ChoiceWidget
  | ScaleWidget
  | MultiWidget
  | DatesWidget;

export interface PackingItem {
  id: string;
  label: string;
  quantity: number;
  rationale?: string;
  critical?: boolean;
  weatherNote?: string;
  owner: string;
  group: PackingGroupId;
}

export interface PackingList {
  title?: string;
  recap?: string;
  weatherSummary?: string;
  notes: string[];
  items: PackingItem[];
}

export interface PackingProgress {
  list: PackingList;
  checkedIds: string[];
  dismissedIds: string[];
}

const GROUP_IDS = new Set<string>(PACKING_GROUPS.map((group) => group.id));

function slugId(value: string, index: number): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return slug || `item-${index + 1}`;
}

export function isPackingGroupId(value: string): value is PackingGroupId {
  return GROUP_IDS.has(value);
}

export function normalizePackingList(raw: PackingList): PackingList {
  const used = new Set<string>();
  const items = raw.items.map((item, index) => {
    let id = item.id.trim() || slugId(item.label, index);
    if (used.has(id)) id = `${id}-${index + 1}`;
    used.add(id);
    const group = isPackingGroupId(item.group) ? item.group : "activity";
    return {
      ...item,
      id,
      group,
      owner: item.owner.trim() || "You",
      quantity: Math.max(1, Math.round(item.quantity)),
    };
  });

  return {
    title: raw.title?.trim() || undefined,
    recap: raw.recap?.trim() || undefined,
    weatherSummary: raw.weatherSummary?.trim() || undefined,
    notes: raw.notes.map((note) => note.trim()).filter(Boolean).slice(0, 3),
    items,
  };
}

export function mergePackingProgress(
  prev: PackingProgress | null,
  next: PackingList,
): PackingProgress {
  const list = normalizePackingList(next);
  const ids = new Set(list.items.map((item) => item.id));
  return {
    list,
    checkedIds: (prev?.checkedIds ?? []).filter((id) => ids.has(id)),
    dismissedIds: (prev?.dismissedIds ?? []).filter((id) => ids.has(id)),
  };
}

export function visibleItems(progress: PackingProgress): PackingItem[] {
  const dismissed = new Set(progress.dismissedIds);
  return progress.list.items.filter((item) => !dismissed.has(item.id));
}

export function summarizePackingProgress(progress: PackingProgress): string {
  const visible = visibleItems(progress);
  const checked = new Set(progress.checkedIds);
  const packed = visible.filter((item) => checked.has(item.id));
  const remaining = visible.filter((item) => !checked.has(item.id));
  const packedLines = packed
    .map((item) => `- [x] ${item.label} (${item.quantity}) [${item.id}]`)
    .join("\n");
  const remainingLines = remaining
    .map((item) => `- [ ] ${item.label} (${item.quantity}) [${item.id}]`)
    .join("\n");
  const dismissedLines = progress.list.items
    .filter((item) => progress.dismissedIds.includes(item.id))
    .map((item) => `- ${item.label} [${item.id}]`)
    .join("\n");

  return [
    `Packed (${packed.length}):`,
    packedLines || "- none",
    `Still to pack (${remaining.length}):`,
    remainingLines || "- none",
    dismissedLines
      ? `Dismissed as irrelevant:\n${dismissedLines}`
      : "Dismissed: none",
  ].join("\n");
}

export function groupLabel(id: PackingGroupId): string {
  return PACKING_GROUPS.find((group) => group.id === id)?.label ?? id;
}
