import { NextRequest, NextResponse } from "next/server";
import { runAgent, type ChatMessage } from "@/lib/agent";

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

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages) || !messages.every(isChatMessage)) {
    return NextResponse.json(
      { error: "`messages` must be an array of { role, content }." },
      { status: 400 },
    );
  }

  try {
    const result = await runAgent(messages);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Agent error:", err);
    const raw = err instanceof Error ? err.message : "Unexpected agent error.";
    const message = raw.replace(/\u001b\[[0-9;]*m/g, "").trim();
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
