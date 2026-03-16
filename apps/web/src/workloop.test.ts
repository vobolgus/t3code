import { describe, expect, it } from "vitest";

import {
  buildWorkloopTurnPrompt,
  getNextWorkloopPrompt,
  parseWorkloopPrompts,
  stripWorkloopStopSignal,
  shouldStopWorkloopFromAssistantMessage,
  WORKLOOP_STOP_SIGNAL,
} from "./workloop";

describe("parseWorkloopPrompts", () => {
  it("trims prompt lines and drops empty entries", () => {
    expect(
      parseWorkloopPrompts("  continue with the plan  \n\n find bugs and fix them \n  \n stop? "),
    ).toEqual(["continue with the plan", "find bugs and fix them", "stop?"]);
  });
});

describe("getNextWorkloopPrompt", () => {
  it("returns the next prompt and wraps around to the first one", () => {
    expect(getNextWorkloopPrompt(["a", "b", "c"], 1)).toEqual({
      prompt: "b",
      nextPromptIndex: 2,
    });
    expect(getNextWorkloopPrompt(["a", "b", "c"], 2)).toEqual({
      prompt: "c",
      nextPromptIndex: 0,
    });
  });

  it("falls back to the first prompt when the index is out of range", () => {
    expect(getNextWorkloopPrompt(["a", "b"], 99)).toEqual({
      prompt: "a",
      nextPromptIndex: 1,
    });
  });

  it("returns null when there are no prompts configured", () => {
    expect(getNextWorkloopPrompt([], 0)).toBeNull();
  });
});

describe("buildWorkloopTurnPrompt", () => {
  it("appends the explicit stop-signal instruction to each workloop prompt", () => {
    expect(buildWorkloopTurnPrompt("Continue with the plan")).toContain(WORKLOOP_STOP_SIGNAL);
  });
});

describe("shouldStopWorkloopFromAssistantMessage", () => {
  it("stops only when the exact stop signal appears on its own line", () => {
    expect(
      shouldStopWorkloopFromAssistantMessage(`Done.\n\n${WORKLOOP_STOP_SIGNAL}\n`),
    ).toBe(true);
    expect(shouldStopWorkloopFromAssistantMessage("Done. workloop_exit")).toBe(false);
  });
});

describe("stripWorkloopStopSignal", () => {
  it("removes the standalone stop signal from displayed assistant text", () => {
    expect(stripWorkloopStopSignal(`Done.\n\n${WORKLOOP_STOP_SIGNAL}\n`)).toBe("Done.");
  });
});
