import { afterEach, describe, expect, it } from "bun:test";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { setAgentEnvironment } from "../testing/agent-env";
import { agentHintFor, userHintFor, WALLET_CLI_SKILL_DOCS_URL } from "./usb-timeout-hints";

const AGENT_SKILLS_BLOB_ROOT = "https://github.com/LedgerHQ/agent-skills/blob/main/";

let restoreAgentEnvironment: (() => void) | undefined;

afterEach(() => {
  restoreAgentEnvironment?.();
  restoreAgentEnvironment = undefined;
});

describe("agentHintFor", () => {
  it("names the sandbox bypass in the wording LIVE-31394 specifies, then the udev rules", () => {
    expect(agentHintFor("sandbox_blocking_usb")).toBe(
      "If you are running this through Claude Code, Codex CLI, Cursor, or another sandboxed " +
        "agent, the sandbox is likely blocking USB access. Set `dangerouslyDisableSandbox: true` " +
        "on the Bash tool (Claude Code) or the equivalent for your agent. If the command already " +
        "runs outside the sandbox, on Linux check that the Ledger udev rules are installed. See " +
        `${WALLET_CLI_SKILL_DOCS_URL} for details.`,
    );
  });

  it("names every agent family, so an unrecognised agent still learns about the bypass", () => {
    const hint = agentHintFor("sandbox_blocking_usb") ?? "";
    for (const agent of ["Claude Code", "Codex CLI", "Cursor", "another sandboxed agent"]) {
      expect(hint).toContain(agent);
    }
  });

  it("asks an agent to confirm the device is plugged in before suspecting the sandbox of hiding it", () => {
    restoreAgentEnvironment = setAgentEnvironment("claude");
    const hint = agentHintFor("device_not_present") ?? "";
    expect(hint).toStartWith("If the user confirms the Ledger is plugged in and unlocked");
    expect(hint).toContain("dangerouslyDisableSandbox: true");
  });

  it("says nothing about a sandbox to a human whose Ledger is not plugged in", () => {
    restoreAgentEnvironment = setAgentEnvironment("none");
    expect(agentHintFor("device_not_present")).toBeUndefined();
  });

  it("is omitted for causes a sandbox bypass cannot fix", () => {
    restoreAgentEnvironment = setAgentEnvironment("claude");
    for (const cause of ["app_not_open", "unknown"] as const) {
      expect(agentHintFor(cause)).toBeUndefined();
    }
  });
});

describe("userHintFor", () => {
  it("names the terminal checks for a refused or unattributed USB failure", () => {
    const hint =
      "If you are running this directly in a terminal: check that the device is plugged in and " +
      "unlocked, that no other process (Ledger Live, a browser tab using WebUSB) is holding the " +
      "device, and on Linux that the Ledger udev rules are installed.";
    expect(userHintFor("sandbox_blocking_usb")).toBe(hint);
    expect(userHintFor("unknown")).toBe(hint);
  });

  it("always returns something actionable, for every cause", () => {
    for (const cause of [
      "sandbox_blocking_usb",
      "device_not_present",
      "app_not_open",
      "unknown",
    ] as const) {
      expect(userHintFor(cause).length).toBeGreaterThan(20);
    }
  });
});

describe("WALLET_CLI_SKILL_DOCS_URL", () => {
  it("points at the SKILL.md the agent plugin export publishes to agent-skills", async () => {
    const appRoot = path.resolve(import.meta.dir, "../..");
    const agentSkillsCheckout = await mkdtemp(path.join(tmpdir(), "wallet-cli-skill-docs-url-"));
    try {
      execFileSync(
        process.execPath,
        [path.join(appRoot, "scripts/export-agent-plugin.mjs"), agentSkillsCheckout],
        { stdio: "pipe" },
      );

      expect(WALLET_CLI_SKILL_DOCS_URL).toStartWith(AGENT_SKILLS_BLOB_ROOT);
      const publishedPath = WALLET_CLI_SKILL_DOCS_URL.slice(AGENT_SKILLS_BLOB_ROOT.length);
      expect(existsSync(path.join(agentSkillsCheckout, publishedPath))).toBe(true);
    } finally {
      await rm(agentSkillsCheckout, { recursive: true, force: true });
    }
  });
});
