import { describe, expect, it } from "bun:test";
import { agentHintFor, userHintFor, WALLET_CLI_SKILL_DOCS_URL } from "./usb-timeout-hints";

describe("agentHintFor", () => {
  it("matches the wording LIVE-31394 specifies", () => {
    const hint = agentHintFor("sandbox_blocking_usb");
    expect(hint).toBe(
      "If you are running this through Claude Code, Codex CLI, Cursor, or another sandboxed " +
        "agent, the sandbox is likely blocking USB access. Set `dangerouslyDisableSandbox: true` " +
        "on the Bash tool (Claude Code) or the equivalent for your agent. See " +
        `${WALLET_CLI_SKILL_DOCS_URL} for details.`,
    );
  });

  it("names every agent family, so an unrecognised agent still learns about the bypass", () => {
    const hint = agentHintFor("sandbox_blocking_usb") ?? "";
    for (const agent of ["Claude Code", "Codex CLI", "Cursor", "another sandboxed agent"]) {
      expect(hint).toContain(agent);
    }
  });

  it("does not depend on the environment", () => {
    // Deliberately not gated on detectAgent(): the text is conditional, so it reads correctly for
    // a human, and an agent we cannot detect is exactly the case that needs it most.
    const before = agentHintFor("sandbox_blocking_usb");
    process.env.CLAUDECODE = "1";
    try {
      expect(agentHintFor("sandbox_blocking_usb")).toBe(before);
    } finally {
      delete process.env.CLAUDECODE;
    }
  });

  it("is omitted for causes that are not host-side", () => {
    for (const cause of [
      "device_not_present",
      "app_not_open",
      "usb_session_stale",
      "unknown",
    ] as const) {
      expect(agentHintFor(cause)).toBeUndefined();
    }
  });
});

describe("userHintFor", () => {
  it("matches the wording LIVE-31394 specifies for the host-blocked case", () => {
    expect(userHintFor("sandbox_blocking_usb")).toBe(
      "If you are running this directly in a terminal: check that the device is plugged in and " +
        "unlocked, and that no other process (Ledger Live, browser tab using WebHID) is holding " +
        "the device.",
    );
  });

  it("always returns something actionable, for every cause", () => {
    for (const cause of [
      "sandbox_blocking_usb",
      "device_not_present",
      "app_not_open",
      "usb_session_stale",
      "unknown",
    ] as const) {
      expect(userHintFor(cause).length).toBeGreaterThan(20);
    }
  });
});

describe("WALLET_CLI_SKILL_DOCS_URL", () => {
  it("points at the path the sync workflow actually publishes to", () => {
    // LIVE-31394 quotes .../blob/main/wallet-cli/SKILL.md, which does not exist; the real path is
    // fixed by .github/workflows/sync-wallet-cli-skill.yml (TARGET_SKILL_DIR).
    expect(WALLET_CLI_SKILL_DOCS_URL).toBe(
      "https://github.com/LedgerHQ/agent-skills/blob/main/skills/wallet-cli/wallet-cli-usage/SKILL.md",
    );
  });
});
