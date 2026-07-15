import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { hyperlink, isInteractive, withSpinner } from "./ui";

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

describe("hyperlink", () => {
  const agentVars = [
    "CLAUDECODE",
    "CLAUDE_CODE",
    "CURSOR_AGENT",
    "CODEX_ENABLED",
    "GEMINI_CLI",
    "OPENCODE",
    "AMP_CURRENT_THREAD_ID",
    "AGENT",
  ];

  let savedIsTTY: boolean | undefined;
  let savedEnv: Record<string, string | undefined> = {};
  beforeEach(() => {
    savedIsTTY = process.stdout.isTTY;
    savedEnv = {};
    for (const k of agentVars) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    process.stdout.isTTY = savedIsTTY as boolean;
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("wraps the url in an OSC 8 hyperlink on an interactive TTY", () => {
    process.stdout.isTTY = true;
    expect(hyperlink("ledgerlive://discover/lido")).toBe(
      "\x1b]8;;ledgerlive://discover/lido\x1b\\ledgerlive://discover/lido\x1b]8;;\x1b\\",
    );
  });

  it("uses a custom label when provided", () => {
    process.stdout.isTTY = true;
    expect(hyperlink("ledgerlive://discover/lido", "Lido")).toBe(
      "\x1b]8;;ledgerlive://discover/lido\x1b\\Lido\x1b]8;;\x1b\\",
    );
  });

  it("strips control chars from url and label so they can't inject their own escape sequences", () => {
    process.stdout.isTTY = true;
    // ESC/BEL smuggled into a backend-derived url/label must be scrubbed so the only real escape
    // sequences in the output are the ones hyperlink() itself emits (the inert `]8;;` text is
    // harmless once its ESC is gone).
    expect(hyperlink("ledgerlive://x\x1b]8;;evil", "La\x07bel\x1b")).toBe(
      "\x1b]8;;ledgerlive://x]8;;evil\x1b\\Label\x1b]8;;\x1b\\",
    );
  });

  it("returns the plain url when stdout is not a TTY", () => {
    process.stdout.isTTY = false as unknown as true;
    expect(hyperlink("ledgerlive://discover/lido")).toBe("ledgerlive://discover/lido");
  });

  it("keeps the url copy-pasteable when a custom label is used off a TTY", () => {
    process.stdout.isTTY = false as unknown as true;
    expect(hyperlink("ledgerlive://discover/lido", "Lido")).toBe(
      "Lido (ledgerlive://discover/lido)",
    );
  });

  it("returns the plain url under an AI agent even on a TTY", () => {
    process.stdout.isTTY = true;
    process.env.CLAUDECODE = "1";
    expect(hyperlink("ledgerlive://discover/lido")).toBe("ledgerlive://discover/lido");
  });
});

describe("withSpinner", () => {
  it("returns the resolved value (humanMode=false)", async () => {
    const result = await withSpinner("loading", "done", async () => 42, false);
    expect(result).toBe(42);
  });

  it("propagates errors (humanMode=false)", async () => {
    await expect(
      withSpinner(
        "loading",
        "done",
        async () => {
          throw new Error("fail");
        },
        false,
      ),
    ).rejects.toThrow("fail");
  });

  it("returns the resolved value (humanMode=true, non-interactive env)", async () => {
    const savedClaudeCode = process.env.CLAUDECODE;
    try {
      process.env.CLAUDECODE = "1";
      const result = await withSpinner("loading", "done", async () => "ok", true);
      expect(result).toBe("ok");
    } finally {
      if (savedClaudeCode === undefined) delete process.env.CLAUDECODE;
      else process.env.CLAUDECODE = savedClaudeCode;
    }
  });
});
