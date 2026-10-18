/**
 * Actionable hints attached to a USB failure envelope, worded per LIVE-31394.
 *
 * Two hints rather than one: `agent_hint` names a host-side fix only an AI agent can apply, while
 * `user_hint` names the device-side checks a human can make. Both are phrased conditionally, so
 * each is safe to emit without knowing which of the two is reading — an agent we do not recognise
 * still gets the bypass instruction, which is the case that most needs it.
 */

import type { UsbTimeoutLikelyCause } from "./device-state";

/** Where `.agents/skills/ledger-wallet-cli` is published by `sync-wallet-cli-skill.yml`. */
export const WALLET_CLI_SKILL_DOCS_URL =
  "https://github.com/LedgerHQ/agent-skills/blob/main/skills/wallet-cli/wallet-cli-usage/SKILL.md";

/** Undefined on any other cause: the sandbox is not implicated and the advice would be wrong. */
export function agentHintFor(cause: UsbTimeoutLikelyCause): string | undefined {
  if (cause !== "sandbox_blocking_usb") return undefined;

  return (
    "If you are running this through Claude Code, Codex CLI, Cursor, or another sandboxed agent, " +
    "the sandbox is likely blocking USB access. Set `dangerouslyDisableSandbox: true` on the Bash " +
    `tool (Claude Code) or the equivalent for your agent. See ${WALLET_CLI_SKILL_DOCS_URL} for details.`
  );
}

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
