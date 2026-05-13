import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

type MockSpinner = {
  text: string;
  isSpinning: boolean;
  start: () => MockSpinner;
  stop: () => MockSpinner;
  success: () => MockSpinner;
  error: () => MockSpinner;
  clear: () => MockSpinner;
};

const createdSpinners: MockSpinner[] = [];

mock.module("yocto-spinner", () => ({
  default: ({ text }: { text: string }) => {
    const spin: MockSpinner = {
      text,
      isSpinning: false,
      start() {
        this.isSpinning = true;
        return this;
      },
      stop() {
        this.isSpinning = false;
        return this;
      },
      success() {
        this.isSpinning = false;
        return this;
      },
      error() {
        this.isSpinning = false;
        return this;
      },
      clear() {
        return this;
      },
    };
    createdSpinners.push(spin);
    return spin;
  },
}));

const { spinner } = await import("./ui");

describe("spinner", () => {
  const envVars = [
    "CLAUDECODE",
    "CLAUDE_CODE",
    "CURSOR_AGENT",
    "CODEX_ENABLED",
    "GEMINI_CLI",
    "OPENCODE",
    "AMP_CURRENT_THREAD_ID",
  ];

  let savedEnv: Record<string, string | undefined> = {};
  let stderrIsTTY: PropertyDescriptor | undefined;

  beforeEach(() => {
    createdSpinners.length = 0;
    savedEnv = {};
    for (const k of [...envVars, "AGENT"]) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
    stderrIsTTY = Object.getOwnPropertyDescriptor(process.stderr, "isTTY");
    Object.defineProperty(process.stderr, "isTTY", {
      value: true,
      configurable: true,
    });
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    if (stderrIsTTY) {
      Object.defineProperty(process.stderr, "isTTY", stderrIsTTY);
    }
  });

  it("stops the previous spinner before starting a new one", () => {
    const first = spinner("first") as unknown as MockSpinner;
    expect(first.isSpinning).toBe(true);

    const second = spinner("second") as unknown as MockSpinner;
    expect(first.isSpinning).toBe(false);
    expect(second.isSpinning).toBe(true);
    expect(createdSpinners).toHaveLength(2);
  });
});
