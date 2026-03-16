import type { ThreadId } from "@t3tools/contracts";

const WORKLOOP_STORAGE_KEY = "t3code:workloop:v1";
export const WORKLOOP_STOP_SIGNAL = "WORKLOOP_EXIT";
const WORKLOOP_STOP_INSTRUCTION =
  `If the workloop should stop after this turn, include the exact line ${WORKLOOP_STOP_SIGNAL} in your final response.`;

interface StoredWorkloopConfig {
  promptsByThreadId?: Record<string, string>;
}

function asPromptMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] =>
        typeof entry[0] === "string" && typeof entry[1] === "string",
    ),
  );
}

function readStoredConfig(): StoredWorkloopConfig {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(WORKLOOP_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as StoredWorkloopConfig;
    return {
      promptsByThreadId: asPromptMap(parsed.promptsByThreadId),
    };
  } catch {
    return {};
  }
}

export function parseWorkloopPrompts(promptText: string): string[] {
  return promptText
    .split(/\r?\n/)
    .map((prompt) => prompt.trim())
    .filter((prompt) => prompt.length > 0);
}

export function getNextWorkloopPrompt(
  prompts: ReadonlyArray<string>,
  nextPromptIndex: number,
): { prompt: string; nextPromptIndex: number } | null {
  if (prompts.length === 0) {
    return null;
  }

  const normalizedIndex =
    nextPromptIndex >= 0 && nextPromptIndex < prompts.length ? nextPromptIndex : 0;
  const prompt = prompts[normalizedIndex];
  if (!prompt) {
    return null;
  }

  return {
    prompt,
    nextPromptIndex: (normalizedIndex + 1) % prompts.length,
  };
}

export function buildWorkloopTurnPrompt(prompt: string): string {
  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length === 0) {
    return WORKLOOP_STOP_INSTRUCTION;
  }
  return `${trimmedPrompt}\n\n${WORKLOOP_STOP_INSTRUCTION}`;
}

export function stripWorkloopStopSignal(text: string): string {
  const filteredLines = text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== WORKLOOP_STOP_SIGNAL);

  return filteredLines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

export function shouldStopWorkloopFromAssistantMessage(messageText: string): boolean {
  return new RegExp(`^\\s*${WORKLOOP_STOP_SIGNAL}\\s*$`, "m").test(messageText);
}

export function readPersistedWorkloopPromptText(threadId: ThreadId): string {
  const promptsByThreadId = readStoredConfig().promptsByThreadId ?? {};
  return promptsByThreadId[threadId] ?? "";
}

export function writePersistedWorkloopPromptText(threadId: ThreadId, promptText: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const current = readStoredConfig().promptsByThreadId ?? {};
  const trimmedPromptText = promptText.trim();
  const nextPromptsByThreadId = { ...current };

  if (trimmedPromptText.length === 0) {
    delete nextPromptsByThreadId[threadId];
  } else {
    nextPromptsByThreadId[threadId] = promptText;
  }

  try {
    if (Object.keys(nextPromptsByThreadId).length === 0) {
      window.localStorage.removeItem(WORKLOOP_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      WORKLOOP_STORAGE_KEY,
      JSON.stringify({
        promptsByThreadId: nextPromptsByThreadId,
      } satisfies StoredWorkloopConfig),
    );
  } catch {
    // Ignore storage write failures to keep chat interactions available.
  }
}
