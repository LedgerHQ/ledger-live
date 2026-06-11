#!/usr/bin/env bun
import "./embed-usb-native";
import { createCLI } from "@bunli/core";
import "./live-common-setup";
import { emitTestingBuildBannerIfNeeded } from "./shared/testing-build-banner";
// createCLI() normally tries to import .bunli/commands.gen.ts from process.cwd() via a file:// URL.
// Our @bunli/core patch removes that dynamic import entirely because it can hang in Bun standalone
// mode, this static import registers commands instead.
// This side-effect import registers commands in the standalone binary.
import "../.bunli/commands.gen";
import bunliConfig from "../bunli.config";
import { getCliProcessExitCode } from "./cli-process-exit-error";
import { disposeWalletCliDmkTransportFully } from "./device/register-dmk-transport";
import { explicitTransportKind, wasBleInitialized } from "./device/transport-kind";
import { restoreTerminalCursor } from "./shared/ui";
import AccountGroup from "./commands/account/index";
import AssetsGroup from "./commands/assets/index";
import SessionGroup from "./commands/session/index";
import BalancesCommand from "./commands/balances";
import OperationsCommand from "./commands/operations";
import ReceiveCommand from "./commands/receive";
import SendCommand from "./commands/send";
import SwapGroup from "./commands/swap/index";
import GenuineCheckCommand from "./commands/genuine-check";
import DevicesCommand from "./commands/devices";

emitTestingBuildBannerIfNeeded();

/**
 * Runs the CLI in-process. Called by the test runner directly (no subprocess).
 *
 * Using noExit:true on bunli's run() means bunli returns a numeric exit code
 * instead of calling process.exit(). Any CliProcessExitError thrown by output.ts
 * is caught here so the caller gets a clean numeric code back.
 */
export async function runMain(argv: string[] = process.argv.slice(2)): Promise<number> {
  const cli = await createCLI(bunliConfig as unknown as Parameters<typeof createCLI>[0]);
  cli.command(AccountGroup);
  cli.command(AssetsGroup);
  cli.command(SessionGroup);
  cli.command(BalancesCommand);
  cli.command(OperationsCommand);
  cli.command(ReceiveCommand);
  cli.command(SendCommand);
  cli.command(SwapGroup);
  cli.command(GenuineCheckCommand);
  cli.command(DevicesCommand);
  const code = await cli.run(normalizeNegatedFlags(argv), { noExit: true });
  return code ?? 0;
}

// bunli silently drops unknown --no-foo flags; rewrite to --foo=false for GNU-style negation.
function normalizeNegatedFlags(argv: string[]): string[] {
  return argv.map(arg => (arg.startsWith("--no-") ? `--${arg.slice(5)}=false` : arg));
}

if (import.meta.main) {
  // Validate WALLET_CLI_TRANSPORT up front if set, so a typo fails fast with a
  // clear message before any work (the transport is otherwise inferred per device).
  try {
    explicitTransportKind();
  } catch (e) {
    process.stderr.write(`${e instanceof Error ? e.message : String(e)}\n`);
    process.exit(2);
  }

  let exitCode = 0;
  try {
    exitCode = await runMain();
  } catch (e) {
    const code = getCliProcessExitCode(e);
    if (code === null) throw e;
    exitCode = code;
  } finally {
    await disposeWalletCliDmkTransportFully();
  }
  process.exitCode = exitCode;
  // The BLE transport's noble backend keeps a native handle on the libuv loop
  // that it never unrefs, so the process would hang after a command completes
  // (the USB transport unrefs its hotplug events and drains naturally). Teardown
  // is done by this point and all output has been written, so exit explicitly
  // whenever BLE was initialized — as the active transport, or because a command
  // (e.g. `devices`, or transport inference) scanned BLE. Pure-USB keeps its drain.
  if (wasBleInitialized()) {
    // yocto-spinner hides the cursor; restore it before the hard exit, and let the
    // already-written output flush (TTY writes are synchronous) so the shell prompt
    // starts cleanly on its own line.
    restoreTerminalCursor();
    process.exit(exitCode);
  }
}
