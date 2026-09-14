import { Chat } from "@/components/chat";
import { getSkillManifest } from "@/lib/skills";

export const dynamic = "force-dynamic";

export default function Home() {
  const skills = getSkillManifest().map(({ name, description }) => ({
    name,
    description,
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex flex-col gap-1 border-b border-border px-4 py-3">
        <h1 className="text-sm font-medium text-balance">Packing planner</h1>
        <p className="text-xs text-muted-foreground">
          Behaviour comes from skills. Edit a SKILL.md to change how it works.
        </p>
      </header>
      <Chat initialSkills={skills} />
    </div>
  );
}
