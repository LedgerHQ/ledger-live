import { describe, it, expect, afterEach } from "bun:test";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runCli } from "../helpers/cli-runner";
import { APP_NAME } from "../../session/session-store";

let tmpDir: string | undefined;
afterEach(async () => {
  if (tmpDir) {
    await rm(tmpDir, { recursive: true, force: true });
    tmpDir = undefined;
  }
});

async function makeStateHome(): Promise<string> {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), "wallet-cli-nudgetest-"));
  return tmpDir;
}

function markerPath(stateHome: string): string {
  return path.join(stateHome, APP_NAME, "first-run.json");
}

// Neutralizes every ambient agent signal (e.g. CURSOR_AGENT is present in the
// real process.env when this suite runs inside Cursor) so per-agent tests can
// assert on exactly the one they set.
const CLEAR_AGENTS = {
  CLAUDECODE: "",
  CLAUDE_CODE: "",
  CURSOR_AGENT: "",
  CODEX_ENABLED: "",
  GEMINI_CLI: "",
  OPENCODE: "",
  AMP_CURRENT_THREAD_ID: "",
  AGENT: "",
};

/** Env that lets the nudge fire: re-enable it and isolate the state marker. */
function nudgeEnv(
  stateHome: string,
  overrides: Record<string, string> = {},
): Record<string, string> {
  return {
    WALLET_CLI_NO_NUDGE: "",
    XDG_STATE_HOME: stateHome,
    ...overrides,
  };
}

// runCli runs in-process, so we can toggle the real process's stderr.isTTY to
// exercise the interactive-human vs. plain-pipe branch with no agent detected.
//
// Other suites (output.test / ui-spinner.test) redefine process.stderr.isTTY as
// a *non-writable* data property and only restore it when it started as an own
// property — so in the full-suite run it can reach us read-only, and a plain
// `stream.isTTY = …` then throws "Attempted to assign to readonly property".
// Redefine it (configurable + writable) so we're order-independent, and restore
// the exact prior descriptor afterwards (or delete it if there was none).
async function withStderrTTY<T>(isTTY: boolean, fn: () => Promise<T>): Promise<T> {
  const stream = process.stderr as unknown as { isTTY?: boolean };
  const original = Object.getOwnPropertyDescriptor(stream, "isTTY");
  Object.defineProperty(stream, "isTTY", {
    value: isTTY,
    configurable: true,
    writable: true,
    enumerable: true,
  });
  try {
    return await fn();
  } finally {
    if (original) {
      Object.defineProperty(stream, "isTTY", original);
    } else {
      delete stream.isTTY;
    }
  }
}

const TIP = "Tip:";
const INSTALL = "wallet-cli skill install --all";

describe("first-run nudge", () => {
  it("shows once, then not again for the same user", async () => {
    const stateHome = await makeStateHome();

    const first = await runCli(["session", "view"], nudgeEnv(stateHome));
    expect(first.exitCode, `stderr: ${first.stderr}`).toBe(0);
    expect(first.stderr).toContain(TIP);
    expect(first.stderr).toContain(INSTALL);
    expect(existsSync(markerPath(stateHome))).toBe(true);

    const second = await runCli(["session", "view"], nudgeEnv(stateHome));
    expect(second.exitCode).toBe(0);
    expect(second.stderr).not.toContain(TIP);
  });

  it("respects WALLET_CLI_NO_NUDGE=1", async () => {
    const stateHome = await makeStateHome();

    const res = await runCli(
      ["session", "view"],
      nudgeEnv(stateHome, { WALLET_CLI_NO_NUDGE: "1" }),
    );
    expect(res.exitCode).toBe(0);
    expect(res.stderr).not.toContain(TIP);
    expect(existsSync(markerPath(stateHome))).toBe(false);
  });

  it("is suppressed under --output json", async () => {
    const stateHome = await makeStateHome();

    const res = await runCli(["session", "view", "--output", "json"], nudgeEnv(stateHome));
    expect(res.exitCode).toBe(0);
    expect(res.stdout).not.toContain(TIP);
    expect(res.stderr).not.toContain(TIP);
    // Marker must not be written when the nudge is skipped.
    expect(existsSync(markerPath(stateHome))).toBe(false);
  });

  it("tailors the --agent flag for Claude Code", async () => {
    const stateHome = await makeStateHome();
    const res = await runCli(
      ["session", "view"],
      nudgeEnv(stateHome, { ...CLEAR_AGENTS, CLAUDECODE: "1" }),
    );
    expect(res.exitCode).toBe(0);
    expect(res.stderr).toContain("wallet-cli skill install --all --agent claude");
  });

  it("tailors the --agent flag for Cursor", async () => {
    const stateHome = await makeStateHome();
    const res = await runCli(
      ["session", "view"],
      nudgeEnv(stateHome, { ...CLEAR_AGENTS, CURSOR_AGENT: "1" }),
    );
    expect(res.exitCode).toBe(0);
    expect(res.stderr).toContain("wallet-cli skill install --all --agent cursor");
  });

  it("tailors the --agent flag for Codex", async () => {
    const stateHome = await makeStateHome();
    const res = await runCli(
      ["session", "view"],
      nudgeEnv(stateHome, { ...CLEAR_AGENTS, CODEX_ENABLED: "1" }),
    );
    expect(res.exitCode).toBe(0);
    expect(res.stderr).toContain("wallet-cli skill install --all --agent codex");
  });

  it("tailors the --agent flag to the generic `agents` bucket for opencode/Gemini/amp", async () => {
    const stateHome = await makeStateHome();
    const res = await runCli(
      ["session", "view"],
      nudgeEnv(stateHome, { ...CLEAR_AGENTS, OPENCODE: "1" }),
    );
    expect(res.exitCode).toBe(0);
    // The generic bucket still maps to a valid --agent value (-> .agents/skills);
    // a bare `skill install` would default to --agent claude (wrong directory).
    expect(res.stderr).toContain("wallet-cli skill install --all --agent agents");
  });

  it("does not consume the nudge on flag-led (help/version/bare-root) invocations", async () => {
    // Force an agent env so the no-subcommand guard is the only thing suppressing
    // the nudge; cover `--help`, `-h` and `--version` (all lead with a flag).
    for (const argv of [["--help"], ["-h"], ["--version"]]) {
      const stateHome = await makeStateHome();
      const res = await runCli(argv, nudgeEnv(stateHome, { ...CLEAR_AGENTS, CLAUDECODE: "1" }));
      expect(res.stderr, `argv: ${argv.join(" ")}`).not.toContain(TIP);
      expect(existsSync(markerPath(stateHome)), `argv: ${argv.join(" ")}`).toBe(false);
      await rm(stateHome, { recursive: true, force: true });
    }
  });

  it("shows for an interactive human (TTY) even when no agent is detected", async () => {
    const stateHome = await makeStateHome();
    const res = await withStderrTTY(true, () =>
      runCli(["session", "view"], nudgeEnv(stateHome, { ...CLEAR_AGENTS })),
    );
    expect(res.exitCode, `stderr: ${res.stderr}`).toBe(0);
    expect(res.stderr).toContain(TIP);
    expect(existsSync(markerPath(stateHome))).toBe(true);
  });

  it("stays quiet in a plain non-interactive pipe with no agent detected", async () => {
    const stateHome = await makeStateHome();
    const res = await withStderrTTY(false, () =>
      runCli(["session", "view"], nudgeEnv(stateHome, { ...CLEAR_AGENTS })),
    );
    expect(res.exitCode, `stderr: ${res.stderr}`).toBe(0);
    expect(res.stderr).not.toContain(TIP);
    expect(existsSync(markerPath(stateHome))).toBe(false);
  });

  it("is not shown for `skill` commands and leaves no marker", async () => {
    const stateHome = await makeStateHome();
    const res = await runCli(["skill", "list"], nudgeEnv(stateHome));
    expect(res.exitCode, `stderr: ${res.stderr}`).toBe(0);
    expect(res.stderr).not.toContain(TIP);
    expect(existsSync(markerPath(stateHome))).toBe(false);
  });
});
