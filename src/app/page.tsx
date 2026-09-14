import { Chat } from "@/components/chat";
import { getSkillManifest } from "@/lib/skills";

export const dynamic = "force-dynamic";

export default function Home() {
  const skills = getSkillManifest().map(({ name, description }) => ({
    name,
    description,
  }));

  return <Chat initialSkills={skills} />;
}
