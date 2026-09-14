import fs from "fs";
import path from "path";
import matter from "gray-matter";

/**
 * Skill discovery and progressive loading.
 *
 * This module is the ONLY place that reads the `skills/` folder. It separates
 * the Agent Skills disclosure levels (agentskills.io):
 *
 *   1. MANIFEST — `name` + `description` from YAML frontmatter.
 *   2. BODY / RESOURCES — full instructions and bundled files, read only when
 *      the agent calls a tool.
 *
 * No domain behaviour lives here.
 */

const SKILLS_DIR = path.join(process.cwd(), "skills");
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface SkillMeta {
  name: string;
  description: string;
  dir: string;
}

function skillRoot(dir: string): string {
  return path.join(SKILLS_DIR, dir);
}

function skillFile(dir: string): string {
  return path.join(skillRoot(dir), "SKILL.md");
}

/**
 * Scan `skills/` and parse ONLY frontmatter. Not cached — edits apply on the
 * next request so changing a SKILL.md is enough to change behaviour.
 */
export function getSkillManifest(): SkillMeta[] {
  const skills: SkillMeta[] = [];
  if (!fs.existsSync(SKILLS_DIR)) return skills;

  for (const entry of fs.readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = skillFile(entry.name);
    if (!fs.existsSync(file)) continue;

    let data: Record<string, unknown>;
    try {
      data = matter(fs.readFileSync(file, "utf8")).data as Record<
        string,
        unknown
      >;
    } catch (err) {
      console.error(`Skipping unreadable skill "${entry.name}":`, err);
      continue;
    }

    const name =
      typeof data.name === "string" && data.name.trim()
        ? data.name.trim()
        : entry.name;
    const description =
      typeof data.description === "string" ? data.description.trim() : "";

    if (!description) {
      console.error(
        `Skipping skill "${entry.name}": description is required for disclosure.`,
      );
      continue;
    }

    if (name.length > 64 || !NAME_PATTERN.test(name)) {
      console.error(
        `Skipping skill "${entry.name}": name "${name}" is invalid.`,
      );
      continue;
    }

    if (name !== entry.name) {
      console.warn(
        `Skill name "${name}" does not match folder "${entry.name}". Loading anyway.`,
      );
    }

    skills.push({ name, description, dir: entry.name });
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

function findSkill(name: string): SkillMeta | undefined {
  return getSkillManifest().find((s) => s.name === name);
}

/** Full instruction body (frontmatter stripped). Called by `load_skill`. */
export function loadSkillBody(name: string): string | null {
  const skill = findSkill(name);
  if (!skill) return null;

  const { content } = matter(fs.readFileSync(skillFile(skill.dir), "utf8"));
  return content.trim();
}

/**
 * Read a bundled resource referenced by a loaded skill.
 * Rejects paths that escape the skill folder.
 */
export function readSkillResource(
  name: string,
  relPath: string,
): string | null {
  const skill = findSkill(name);
  if (!skill) return null;

  const baseDir = skillRoot(skill.dir);
  const target = path.resolve(baseDir, relPath);
  if (target !== baseDir && !target.startsWith(baseDir + path.sep)) {
    return null;
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) return null;

  return fs.readFileSync(target, "utf8");
}
