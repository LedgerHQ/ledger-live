import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { FakeSpinners, type FakeSpinner } from "../testing/fake-spinner";
import { _setTestSpinner, spinner } from "./ui";

const spinners = new FakeSpinners();
beforeAll(() => _setTestSpinner(spinners.create));
afterAll(() => _setTestSpinner(null));

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
    spinners.created.length = 0;
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
    const first = spinner("first") as unknown as FakeSpinner;
    expect(first.isSpinning).toBe(true);

    const second = spinner("second") as unknown as FakeSpinner;
    expect(first.isSpinning).toBe(false);
    expect(second.isSpinning).toBe(true);
    expect(spinners.created).toHaveLength(2);
  });
});
