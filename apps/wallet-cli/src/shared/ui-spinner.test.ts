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

const { spinner, withSuspendedSpinner } = await import("./ui");

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

  it("suspends the active spinner while a task is pending and resumes it after resolution", async () => {
    const spin = spinner("fetching");
    let resolveTask!: () => void;
    const task = new Promise<void>(resolve => {
      resolveTask = resolve;
    });

    const result = withSuspendedSpinner(() => task);

    expect(spin.isSpinning).toBe(false);
    resolveTask();
    await result;
    expect(spin.isSpinning).toBe(true);
  });

  it("resumes the active spinner after a task rejects", async () => {
    const spin = spinner("fetching");
    let rejectTask!: (error: Error) => void;
    const task = new Promise<void>((_, reject) => {
      rejectTask = reject;
    });

    const result = withSuspendedSpinner(() => task);

    expect(spin.isSpinning).toBe(false);
    rejectTask(new Error("failed"));
    await expect(result).rejects.toThrow("failed");
    expect(spin.isSpinning).toBe(true);
  });

  it("does not restart a suspended spinner when a newer spinner starts", async () => {
    const first = spinner("first");
    let resolveTask!: () => void;
    const task = new Promise<void>(resolve => {
      resolveTask = resolve;
    });
    const result = withSuspendedSpinner(() => task);

    const second = spinner("second");
    resolveTask();

    await result;
    expect(first.isSpinning).toBe(false);
    expect(second.isSpinning).toBe(true);
  });
});
