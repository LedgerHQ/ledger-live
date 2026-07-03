import { getErrorName as resolveErrorName } from "@ledgerhq/live-common/exchange/error";
import { commandMeta } from "../../.bunli/commands.gen";
import { WalletCliDeviceError } from "../device/wallet-cli-device-error";
import { track } from "./segment";

const GROUP_COMMANDS = new Set<string>(Object.keys(commandMeta));

export function parseCommand(argv: string[]): string | undefined {
  const words: string[] = [];
  for (const arg of argv) {
    if (arg.startsWith("-")) break;
    words.push(arg);
  }
  if (words.length === 0) {
    return undefined;
  }
  return GROUP_COMMANDS.has(words[0]) && words[1] ? `${words[0]} ${words[1]}` : words[0];
}

function getErrorName(error: unknown): string {
  if (error instanceof WalletCliDeviceError) return error.state.code;
  return resolveErrorName(error) ?? "unknown";
}

export function trackCommandInvoked(command: string, argv: string[]): void {
  track("command_invoked", {
    page: command,
    command,
    dryRun: argv.includes("--dry-run"),
    flagsUsed: argv
      .filter(a => a.startsWith("--") && a !== "--")
      .map(a => a.slice(2).split("=")[0]),
  });
}

export function trackCommandCompleted(command: string, durationMs: number): void {
  track("command_completed", { page: command, durationMs });
}

export function trackCommandFailed(command: string, durationMs: number, error: unknown): void {
  track("command_failed", { page: command, durationMs, errorName: getErrorName(error) });
}
