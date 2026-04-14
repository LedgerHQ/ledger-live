import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { isInteractive, withSpinner } from "./ui";

describe("isInteractive", () => {
  const envVars = [
    "CLAUDECODE",
    "CLAUDE_CODE",
    "CURSOR_AGENT",
    "CODEX_ENABLED",
    "GEMINI_CLI",
    "OPENCODE",
    "AMP_CURRENT_THREAD_ID",
  ];

  let saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    saved = {};
    for (const k of [...envVars, "AGENT"]) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it.each(envVars)("returns false when %s is set", envVar => {
    process.env[envVar] = "1";
    expect(isInteractive()).toBe(false);
  });

  it("returns false when AGENT=amp", () => {
    process.env.AGENT = "amp";
    expect(isInteractive()).toBe(false);
  });
});

describe("withSpinner", () => {
  it("returns the resolved value (humanMode=false)", async () => {
    const result = await withSpinner("loading", "done", async () => 42, false);
    expect(result).toBe(42);
  });

  it("propagates errors (humanMode=false)", async () => {
    await expect(
      withSpinner("loading", "done", async () => { throw new Error("fail"); }, false),
    ).rejects.toThrow("fail");
  });

  it("returns the resolved value (humanMode=true, non-interactive env)", async () => {
    const result = await withSpinner("loading", "done", async () => "ok", true);
    expect(result).toBe("ok");
  });
});
