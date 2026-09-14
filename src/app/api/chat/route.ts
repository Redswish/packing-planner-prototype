import { NextRequest, NextResponse } from "next/server";
import { runAgent, type ChatMessage } from "@/lib/agent";
import {
  isPackingGroupId,
  type PackingItem,
  type PackingList,
  type PackingProgress,
} from "@/lib/packing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const message = value as { role?: unknown; content?: unknown };
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string"
  );
}

function isPackingItem(value: unknown): value is PackingItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as PackingItem;
  return (
    typeof item.id === "string" &&
    typeof item.label === "string" &&
    typeof item.quantity === "number" &&
    typeof item.owner === "string" &&
    typeof item.group === "string" &&
    isPackingGroupId(item.group)
  );
}

function isPackingList(value: unknown): value is PackingList {
  if (typeof value !== "object" || value === null) return false;
  const list = value as PackingList;
  return Array.isArray(list.notes) && Array.isArray(list.items) && list.items.every(isPackingItem);
}

function isPackingProgress(value: unknown): value is PackingProgress {
  if (typeof value !== "object" || value === null) return false;
  const progress = value as PackingProgress;
  return (
    isPackingList(progress.list) &&
    Array.isArray(progress.checkedIds) &&
    progress.checkedIds.every((id) => typeof id === "string") &&
    Array.isArray(progress.dismissedIds) &&
    progress.dismissedIds.every((id) => typeof id === "string")
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = body as { messages?: unknown; packingList?: unknown };
  const messages = payload.messages;
  if (!Array.isArray(messages) || !messages.every(isChatMessage)) {
    return NextResponse.json(
      { error: "`messages` must be an array of { role, content }." },
      { status: 400 },
    );
  }

  const progress =
    payload.packingList === undefined || payload.packingList === null
      ? null
      : isPackingProgress(payload.packingList)
        ? payload.packingList
        : null;

  if (payload.packingList != null && progress === null) {
    return NextResponse.json(
      { error: "`packingList` must be a progress object or null." },
      { status: 400 },
    );
  }

  try {
    const result = await runAgent(messages, progress);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Agent error:", err);
    const raw = err instanceof Error ? err.message : "Unexpected agent error.";
    const message = raw.replace(/\u001b\[[0-9;]*m/g, "").trim();
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
