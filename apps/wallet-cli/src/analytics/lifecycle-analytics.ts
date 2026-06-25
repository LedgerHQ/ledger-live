import { getErrorName as resolveErrorName } from "@ledgerhq/live-common/exchange/error";
import { WalletCliDeviceError } from "../device/wallet-cli-device-error";
import { getCliProcessExitCode } from "../cli-process-exit-error";
import { parseCommand } from "../shared/parse-command";
import { track } from "./segment";

const HELP = "Help";

function trackHelpViewed(p: { command?: string } = {}): void {
  track("help_viewed", { page: HELP, ...(p.command ? { command: p.command } : {}) });
}

function isHelpRequested(argv: string[]): boolean {
  return argv.some(arg => arg === "--help" || arg === "-h");
}

function getErrorName(error: unknown): string {
  // A non-zero exit with no thrown error, or an explicit CliProcessExitError,
  // is an intentional process exit rather than a runtime failure.
  if (error === undefined || getCliProcessExitCode(error) !== null) return "process_exit";
  if (error instanceof WalletCliDeviceError) return error.state.code;
  return resolveErrorName(error) ?? "unknown";
}

function trackCommandInvoked(command: string, argv: string[]): void {
  track("command_invoked", {
    page: command,
    command,
    dryRun: argv.includes("--dry-run"),
    flagsUsed: argv
      .filter(a => a.startsWith("--") && a !== "--")
      .map(a => a.slice(2).split("=")[0]),
  });
}

function trackCommandCompleted(command: string, durationMs: number): void {
  track("command_completed", { page: command, durationMs });
}

function trackCommandFailed(command: string, durationMs: number, error: unknown): void {
  track("command_failed", { page: command, durationMs, errorName: getErrorName(error) });
}

/**
 * Runs a CLI command while emitting its lifecycle analytics (invoked/completed/failed)
 * and measuring its duration. Preserves the entrypoint's exit-code semantics: a
 * CliProcessExitError is converted to its numeric code, any other non-zero outcome is
 * treated as a failure, and unexpected errors are rethrown after tracking.
 */
export async function withCommandLifecycleAnalytics(
  argv: string[],
  run: () => Promise<number>,
): Promise<number> {
  const command = parseCommand(argv);

  if (isHelpRequested(argv)) {
    trackHelpViewed(command ? { command } : {});
  }

  const startedAt = Date.now();
  if (command) trackCommandInvoked(command, argv);

  let exitCode = 0;
  let failure: unknown;
  try {
    exitCode = await run();
  } catch (e) {
    failure = e;
    exitCode = getCliProcessExitCode(e) ?? 1;
  }

  if (command) {
    const durationMs = Date.now() - startedAt;
    if (exitCode === 0) trackCommandCompleted(command, durationMs);
    else trackCommandFailed(command, durationMs, failure);
  }

  if (failure && getCliProcessExitCode(failure) === null) throw failure;
  return exitCode;
}
