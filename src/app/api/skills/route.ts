import { NextResponse } from "next/server";
import { getSkillManifest } from "@/lib/skills";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Exposes the skill catalog (names + descriptions only) to the UI. */
export async function GET() {
  const skills = getSkillManifest().map(({ name, description }) => ({
    name,
    description,
  }));
  return NextResponse.json({ skills });
}
