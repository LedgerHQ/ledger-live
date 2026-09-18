/**
 * Actionable hints attached to a USB failure envelope.
 *
 * The wording is taken verbatim from LIVE-31394's specification (source memo
 * `wallet-cli-feedback-2026-05-22.md`, recommendation #2) — only the docs URL is corrected, see
 * `WALLET_CLI_SKILL_DOCS_URL`.
 *
 * Split in two on purpose. `agent_hint` names a host-side fix only an AI agent can apply (its shell
 * sandbox blocks USB); `user_hint` names the device-side and desktop-side checks a human can make.
 * Both are phrased conditionally ("If you are running this through…" / "If you are running this
 * directly in a terminal…"), so each is safe to emit without knowing which of the two is reading:
 * an agent we do not recognise still gets the bypass instruction, which is the case that most needs
 * it.
 *
 * wallet-cli cannot *know* it is sandboxed: there is no syscall for that. It infers it from the OS
 * refusing access to a device it could see. Hence `likely_cause`, not `cause`.
 */

import type { UsbTimeoutLikelyCause } from "./device-state";

/**
 * Published location of the wallet-cli agent skill.
 *
 * LIVE-31394 quotes `…/agent-skills/blob/main/wallet-cli/SKILL.md`, which does not exist. The path
 * is fixed by `.github/workflows/sync-wallet-cli-skill.yml` (`TARGET_SKILL_DIR`), which exports
 * `.agents/skills/ledger-wallet-cli` to `skills/wallet-cli/wallet-cli-usage` in
 * LedgerHQ/agent-skills on every push to develop.
 */
export const WALLET_CLI_SKILL_DOCS_URL =
  "https://github.com/LedgerHQ/agent-skills/blob/main/skills/wallet-cli/wallet-cli-usage/SKILL.md";

/**
 * Host-side hint, for the host-side cause only. Undefined means "omit the field": on any other
 * cause the sandbox is not implicated and the advice would be wrong.
 */
export function agentHintFor(cause: UsbTimeoutLikelyCause): string | undefined {
  if (cause !== "sandbox_blocking_usb") return undefined;

  return (
    "If you are running this through Claude Code, Codex CLI, Cursor, or another sandboxed agent, " +
    "the sandbox is likely blocking USB access. Set `dangerouslyDisableSandbox: true` on the Bash " +
    `tool (Claude Code) or the equivalent for your agent. See ${WALLET_CLI_SKILL_DOCS_URL} for details.`
  );
}

/** Device-side hint for a human. Always present, so the human path is never a dead end. */
export function userHintFor(cause: UsbTimeoutLikelyCause): string {
  switch (cause) {
    case "sandbox_blocking_usb":
    case "unknown":
      return (
        "If you are running this directly in a terminal: check that the device is plugged in and " +
        "unlocked, and that no other process (Ledger Live, browser tab using WebHID) is holding " +
        "the device."
      );
    case "device_not_present":
      return "Plug the Ledger into a USB port, unlock it, and retry.";
    case "app_not_open":
      return "Unlock the device and open the app the command needs, then retry.";
    case "usb_session_stale":
      return "The device locked mid-session. Unplug and replug it, then retry.";
  }
}
