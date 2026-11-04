/**
 * Actionable hints attached to a USB failure envelope, worded per LIVE-31394.
 *
 * `agent_hint` names a host-side fix only an AI agent can apply, while `user_hint` names the
 * device-side checks a human can make.
 */

import { detectAgent } from "../shared/agent-detection";
import type { UsbLikelyCause } from "./device-state";

export const WALLET_CLI_SKILL_DOCS_URL =
  "https://github.com/LedgerHQ/agent-skills/blob/main/skills/wallet-cli-usage/SKILL.md";

const SANDBOX_BYPASS =
  "Set `dangerouslyDisableSandbox: true` on the Bash tool (Claude Code) or the equivalent for your agent.";

export function agentHintFor(cause: UsbLikelyCause): string | undefined {
  switch (cause) {
    case "sandbox_blocking_usb":
      return (
        "If you are running this through Claude Code, Codex CLI, Cursor, or another sandboxed agent, " +
        `the sandbox is likely blocking USB access. ${SANDBOX_BYPASS} If the command already runs ` +
        "outside the sandbox, on Linux check that the Ledger udev rules are installed. " +
        `See ${WALLET_CLI_SKILL_DOCS_URL} for details.`
      );
    case "device_not_present":
      if (!detectAgent().detected) return undefined;
      return (
        "If the user confirms the Ledger is plugged in and unlocked, the sandbox may be hiding it " +
        `from USB enumeration. ${SANDBOX_BYPASS} See ${WALLET_CLI_SKILL_DOCS_URL} for details.`
      );
    case "app_not_open":
    case "unknown":
      return undefined;
  }
}

export function userHintFor(cause: UsbLikelyCause): string {
  switch (cause) {
    case "sandbox_blocking_usb":
    case "unknown":
      return (
        "If you are running this directly in a terminal: check that the device is plugged in and " +
        "unlocked, that no other process (Ledger Live, a browser tab using WebUSB) is holding " +
        "the device, and on Linux that the Ledger udev rules are installed."
      );
    case "device_not_present":
      return "Plug the Ledger into a USB port, unlock it, and retry.";
    case "app_not_open":
      return "Unlock the device and open the app the command needs, then retry.";
  }
}
