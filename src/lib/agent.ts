import { isStepCount, tool, ToolLoopAgent } from "ai";
import { z } from "zod";
import {
  getSkillManifest,
  loadSkillBody,
  readSkillResource,
} from "@/lib/skills";

/**
 * The agent harness.
 *
 * There is no domain behaviour here. Instructions describe only how to discover
 * and load skills. Task behaviour comes from SKILL.md files via `load_skill`.
 */

export const MODEL = "anthropic/claude-sonnet-5";
const MAX_STEPS = 12;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentResult {
  reply: string;
  loadedSkills: string[];
}

function buildInstructions(): string {
  const manifest = getSkillManifest();
  const skillList = manifest.length
    ? manifest.map((s) => `- ${s.name}: ${s.description}`).join("\n")
    : "(No skills are currently installed.)";
  const today = new Date().toISOString().slice(0, 10);

  return `You are an assistant whose specialised abilities come entirely from Agent Skills.

Today's date is ${today}. Use it to resolve relative dates ("next week", "in three days", etc.) into concrete ones instead of asking the user to restate them.

A skill is a set of expert instructions you can load on demand. Right now you know only each skill's name and description — NOT its contents.

How to work:
- When a user's request matches an available skill, you MUST call the \`load_skill\` tool to read that skill's full instructions BEFORE attempting the task, then follow those instructions faithfully.
- If several skills apply, load each one you need before answering.
- A loaded skill may point to bundled resource files. Read them with \`read_skill_resource\` when the instructions tell you to.
- Do not guess or improvise the behaviour a skill is meant to provide. Load it and follow it.
- If no installed skill fits and the request is a general one, just answer normally. If a request needs a capability that no installed skill provides, say so plainly rather than inventing an answer.

Available skills:
${skillList}`;
}

const loadSkill = tool({
  description:
    "Load the full instructions for an installed skill by its exact name. Call this BEFORE performing any task the skill covers. Returns the skill's complete instructions.",
  inputSchema: z.object({
    name: z
      .string()
      .describe("The exact skill name from the Available skills list."),
  }),
  execute: async ({ name }) => {
    const body = loadSkillBody(name);
    if (body === null) {
      return `No skill named "${name}" is installed. Check the Available skills list for exact names.`;
    }
    return body;
  },
});

const readSkillResourceTool = tool({
  description:
    "Read a bundled resource file that a loaded skill references (for example a template or checklist). Only use paths mentioned by a skill you have already loaded.",
  inputSchema: z.object({
    skill: z.string().describe("The exact skill name."),
    path: z
      .string()
      .describe(
        "File path relative to the skill's folder, e.g. 'references/notes.md'.",
      ),
  }),
  execute: async ({ skill, path: relPath }) => {
    const file = readSkillResource(skill, relPath);
    if (file === null) {
      return `Could not read "${relPath}" for skill "${skill}". It may not exist.`;
    }
    return file;
  },
});

export async function runAgent(history: ChatMessage[]): Promise<AgentResult> {
  const agent = new ToolLoopAgent({
    model: MODEL,
    instructions: buildInstructions(),
    tools: {
      load_skill: loadSkill,
      read_skill_resource: readSkillResourceTool,
    },
    stopWhen: isStepCount(MAX_STEPS),
  });

  const result = await agent.generate({
    messages: history.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const loadedSkills = [
    ...new Set(
      result.toolCalls
        .filter((call) => call.toolName === "load_skill")
        .map((call) => {
          const input = call.input as { name?: string };
          return input.name ?? "";
        })
        .filter(Boolean),
    ),
  ];

  const reply =
    result.text.trim() ||
    (result.finishReason === "length"
      ? "I wasn't able to finish that within the allowed number of steps. Please try rephrasing."
      : "");

  return { reply, loadedSkills };
}
