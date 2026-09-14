import { isStepCount, tool, ToolLoopAgent } from "ai";
import { z } from "zod";
import { lookupForecast } from "@/lib/forecast";
import {
  isPackingGroupId,
  normalizePackingList,
  summarizePackingProgress,
  type InterviewWidget,
  type PackingGroupId,
  type PackingList,
  type PackingProgress,
} from "@/lib/packing";
import {
  getSkillManifest,
  loadSkillBody,
  readSkillResource,
} from "@/lib/skills";

/**
 * The agent harness.
 *
 * Domain behaviour still comes from SKILL.md files. The extra tools here only
 * give the model a way to put widgets and a checklist on screen, and to fetch
 * a live forecast when one exists.
 */

export const MODEL = "google/gemini-2.5-flash";
const MAX_STEPS = 18;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentResult {
  reply: string;
  loadedSkills: string[];
  widgets: InterviewWidget[];
  packingList: PackingList | null;
}

const widgetOptionSchema = z.object({
  value: z.string().describe("Machine value returned when the user picks this."),
  label: z.string().describe("Label shown on the control."),
});

const packingGroupSchema = z.enum([
  "documents",
  "clothing",
  "toiletries",
  "electronics",
  "activity",
  "wear-on-day",
]);

function buildInstructions(progress: PackingProgress | null): string {
  const manifest = getSkillManifest();
  const skillList = manifest.length
    ? manifest.map((s) => `- ${s.name}: ${s.description}`).join("\n")
    : "(No skills are currently installed.)";
  const today = new Date().toISOString().slice(0, 10);

  const listContext = progress
    ? `

A packing list is already on screen. Treat it as the source of truth. Reuse existing item ids when you update it. Progress:
${summarizePackingProgress(progress)}

If the user is asking what is left, reporting that they packed some of it, or otherwise coming back to this list, load list-review — do not start a fresh list. Load packing-list only when the trip brief changed enough to rebuild, or there is no list yet.`
    : `

No packing list is on screen yet. Load trip-interview for a cold start. Load packing-list once the brief is settled, or immediately when the user wants a list now.`;

  return `You are an assistant whose specialised abilities come entirely from Agent Skills.

Today's date is ${today}. Use it to resolve relative dates ("next week", "next Tuesday", "in three days") into concrete YYYY-MM-DD dates instead of asking the user to restate them.

A skill is a set of expert instructions you can load on demand. Right now you know only each skill's name and description — NOT its contents.

How to work:
- When a user's request matches an available skill, you MUST call the \`load_skill\` tool to read that skill's full instructions BEFORE attempting the task, then follow those instructions faithfully.
- If several skills apply, load each one you need before answering.
- A loaded skill may point to bundled resource files. Read them with \`read_skill_resource\` when the instructions tell you to.
- Interview questions that have a natural control MUST use the matching tool: dates with \`ask_dates\` (from/to calendar — do not ask nights separately when dates can infer them), luggage with \`ask_choice\`, laundry with \`ask_scale\`, activities with \`ask_multi\`. Destination stays as plain text.
- When you produce or update a packing list, you MUST call \`present_packing_list\`. Do not dump a markdown checklist into chat — the interactive module is the list.
- For a specific-date forecast, call \`lookup_forecast\`. If it misses, say so and use seasonal norms. Never invent a day-by-day outlook.
- Do not guess or improvise the behaviour a skill is meant to provide. Load it and follow it.
- If no installed skill fits and the request is a general one, just answer normally. If a request needs a capability that no installed skill provides, say so plainly rather than inventing an answer.
${listContext}

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
        "File path relative to the skill's folder, e.g. 'templates/essentials.md'.",
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

const askChoice = tool({
  description:
    "Show a this-or-that radio group in the chat (luggage, and any other single choice). Wait for the user's answer after calling it.",
  inputSchema: z.object({
    id: z.string().describe("Stable id, e.g. 'luggage'."),
    question: z.string(),
    options: z.array(widgetOptionSchema).min(2),
  }),
  execute: async () =>
    "Radio group is on screen. Ask nothing else that belongs on a widget this turn, then wait for the user.",
});

const askScale = tool({
  description:
    "Show a numeric slider in the chat (nights away, laundry frequency). Wait for the user's answer after calling it.",
  inputSchema: z.object({
    id: z.string().describe("Stable id, e.g. 'nights' or 'laundry'."),
    question: z.string(),
    min: z.number(),
    max: z.number(),
    step: z.number().optional(),
    unit: z.string().optional(),
    defaultValue: z.number().optional(),
  }),
  execute: async () =>
    "Slider is on screen. Ask nothing else that belongs on a widget this turn, then wait for the user.",
});

const askMulti = tool({
  description:
    "Show a multi-select in the chat (activities). Wait for the user's answer after calling it.",
  inputSchema: z.object({
    id: z.string().describe("Stable id, e.g. 'activities'."),
    question: z.string(),
    options: z.array(widgetOptionSchema).min(2),
  }),
  execute: async () =>
    "Multi-select is on screen. Ask nothing else that belongs on a widget this turn, then wait for the user.",
});

const askDates = tool({
  description:
    "Show a from/to calendar in the chat for travel dates. Use this whenever dates are unknown. Nights and forecast window follow from the range. Wait for the user's answer after calling it.",
  inputSchema: z.object({
    id: z.string().describe("Stable id, e.g. 'dates'."),
    question: z.string(),
  }),
  execute: async () =>
    "Date range calendar is on screen. Ask nothing else that belongs on a widget this turn, then wait for the user.",
});

const presentPackingList = tool({
  description:
    "Render or replace the persistent interactive packing checklist. Call this instead of writing checkbox markdown.",
  inputSchema: z.object({
    title: z.string().optional(),
    recap: z.string().optional(),
    weatherSummary: z.string().optional(),
    notes: z
      .array(z.string())
      .max(3)
      .describe("Two or three trip-specific closing notes."),
    items: z.array(
      z.object({
        id: z
          .string()
          .describe("Stable id. Reuse the same id when updating an item."),
        label: z.string().describe("Item name without the quantity."),
        quantity: z.number().int().positive(),
        rationale: z
          .string()
          .optional()
          .describe("Show the maths when it is not obvious."),
        critical: z
          .boolean()
          .optional()
          .describe("True only if forgetting it would ruin the trip."),
        weatherNote: z
          .string()
          .optional()
          .describe("Tie this item to the forecast or seasonal norm."),
        owner: z
          .string()
          .describe("Traveller name, or 'shared' for group items."),
        group: packingGroupSchema,
      }),
    ),
  }),
  execute: async () =>
    "The interactive checklist is on screen. Do not repeat the full list as markdown. A short recap in chat is enough.",
});

const lookupForecastTool = tool({
  description:
    "Look up a live weather forecast for a place and date. Use this whenever the user asks about a forecast or you need weather for a trip within about 16 days. If it misses, say so and fall back to seasonal norms.",
  inputSchema: z.object({
    destination: z.string().describe("City or place name."),
    date: z.string().describe("Start date as YYYY-MM-DD."),
    endDate: z
      .string()
      .optional()
      .describe("Optional end date as YYYY-MM-DD for a range."),
  }),
  execute: async ({ destination, date, endDate }) => {
    return lookupForecast(destination, date, endDate);
  },
});

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) return null;
  return value as Record<string, unknown>;
}

function asOptions(value: unknown): { value: string; label: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const option = asRecord(entry);
    if (
      !option ||
      typeof option.value !== "string" ||
      typeof option.label !== "string"
    ) {
      return [];
    }
    return [{ value: option.value, label: option.label }];
  });
}

function widgetFromCall(
  toolName: string,
  input: unknown,
): InterviewWidget | null {
  const data = asRecord(input);
  if (!data || typeof data.id !== "string" || typeof data.question !== "string") {
    return null;
  }

  if (toolName === "ask_choice") {
    const options = asOptions(data.options);
    if (options.length < 2) return null;
    return { type: "choice", id: data.id, question: data.question, options };
  }

  if (toolName === "ask_multi") {
    const options = asOptions(data.options);
    if (options.length < 2) return null;
    return { type: "multi", id: data.id, question: data.question, options };
  }

  if (toolName === "ask_scale") {
    if (typeof data.min !== "number" || typeof data.max !== "number") {
      return null;
    }
    return {
      type: "scale",
      id: data.id,
      question: data.question,
      min: data.min,
      max: data.max,
      step: typeof data.step === "number" ? data.step : undefined,
      unit: typeof data.unit === "string" ? data.unit : undefined,
      defaultValue:
        typeof data.defaultValue === "number" ? data.defaultValue : undefined,
    };
  }

  if (toolName === "ask_dates") {
    return { type: "dates", id: data.id, question: data.question };
  }

  return null;
}

function packingListFromCall(input: unknown): PackingList | null {
  const data = asRecord(input);
  if (!data || !Array.isArray(data.items)) return null;

  const items = data.items.flatMap((entry, index) => {
    const item = asRecord(entry);
    if (!item || typeof item.label !== "string") return [];
    const group =
      typeof item.group === "string" && isPackingGroupId(item.group)
        ? item.group
        : ("activity" satisfies PackingGroupId);
    return [
      {
        id: typeof item.id === "string" ? item.id : `item-${index + 1}`,
        label: item.label,
        quantity: typeof item.quantity === "number" ? item.quantity : 1,
        rationale: typeof item.rationale === "string" ? item.rationale : undefined,
        critical: item.critical === true,
        weatherNote:
          typeof item.weatherNote === "string" ? item.weatherNote : undefined,
        owner: typeof item.owner === "string" ? item.owner : "You",
        group,
      },
    ];
  });

  if (items.length === 0) return null;

  return normalizePackingList({
    title: typeof data.title === "string" ? data.title : undefined,
    recap: typeof data.recap === "string" ? data.recap : undefined,
    weatherSummary:
      typeof data.weatherSummary === "string" ? data.weatherSummary : undefined,
    notes: Array.isArray(data.notes)
      ? data.notes.filter((note): note is string => typeof note === "string")
      : [],
    items,
  });
}

export async function runAgent(
  history: ChatMessage[],
  progress: PackingProgress | null = null,
): Promise<AgentResult> {
  const agent = new ToolLoopAgent({
    model: MODEL,
    instructions: buildInstructions(progress),
    tools: {
      load_skill: loadSkill,
      read_skill_resource: readSkillResourceTool,
      ask_choice: askChoice,
      ask_scale: askScale,
      ask_multi: askMulti,
      ask_dates: askDates,
      present_packing_list: presentPackingList,
      lookup_forecast: lookupForecastTool,
    },
    stopWhen: isStepCount(MAX_STEPS),
  });

  const result = await agent.generate({
    messages: history.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const loadedSkills: string[] = [];
  const widgets: InterviewWidget[] = [];
  let packingList: PackingList | null = null;

  for (const call of result.toolCalls) {
    const input = "input" in call ? call.input : undefined;
    if (call.toolName === "load_skill") {
      const data = asRecord(input);
      if (data && typeof data.name === "string" && data.name) {
        loadedSkills.push(data.name);
      }
      continue;
    }
    const widget = widgetFromCall(call.toolName, input);
    if (widget) {
      widgets.push(widget);
      continue;
    }
    if (call.toolName === "present_packing_list") {
      const list = packingListFromCall(input);
      if (list) packingList = list;
    }
  }

  const reply =
    result.text.trim() ||
    (result.finishReason === "length"
      ? "I wasn't able to finish that within the allowed number of steps. Please try rephrasing."
      : "");

  return {
    reply,
    loadedSkills: [...new Set(loadedSkills)],
    widgets,
    packingList,
  };
}
