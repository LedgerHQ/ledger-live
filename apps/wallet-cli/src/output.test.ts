import "./live-common-setup";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

type MockSpinner = {
  text: string;
  isSpinning: boolean;
  start: () => MockSpinner;
  stop: () => MockSpinner;
  success: (text?: string) => MockSpinner;
  error: (text?: string) => MockSpinner;
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
      success(text?: string) {
        if (text) this.text = text;
        this.isSpinning = false;
        return this;
      },
      error(text?: string) {
        if (text) this.text = text;
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

const { createCommandOutput } = await import("./output");

describe("HumanCommandOutput", () => {
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

  it("uses the canonical device-state text for signature requests", () => {
    const out = createCommandOutput("human", {
      command: "send",
      network: "ethereum:main",
      account: "js:2:ethereum:0x123",
    });
    const spin = out.spin("Preparing transaction…") as unknown as MockSpinner;

    out.sendEvent({ type: "device-signature-requested" });

    expect(spin.text).toBe("[⧖] Review on device. Approve or reject.");
    expect(createdSpinners).toHaveLength(1);
  });
});
