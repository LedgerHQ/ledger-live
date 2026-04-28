#!/usr/bin/env bun
import "./embed-usb-native";
import { createCLI } from "@bunli/core";
import "./live-common-setup";
// createCLI() normally tries to import .bunli/commands.gen.ts from process.cwd() via a file:// URL.
// Our @bunli/core patch removes that dynamic import entirely because it can hang in Bun standalone
// mode, this static import registers commands instead.
// This side-effect import registers commands in the standalone binary.
import "../.bunli/commands.gen";
import bunliConfig from "../bunli.config";
import { CliProcessExitError } from "./cli-process-exit-error";
import { disposeWalletCliDmkTransportFully } from "./device/register-dmk-transport";

/**
 * Runs the CLI in-process. Called by the test runner directly (no subprocess).
 *
 * Using noExit:true on bunli's run() means bunli returns a numeric exit code
 * instead of calling process.exit(). Any CliProcessExitError thrown by output.ts
 * is caught here so the caller gets a clean numeric code back.
 */
export async function runMain(argv: string[] = process.argv.slice(2)): Promise<number> {
  const cli = await createCLI(bunliConfig as unknown as Parameters<typeof createCLI>[0]);
  const code = await cli.run(argv, { noExit: true });
  return code ?? 0;
}

if (import.meta.main) {
  let exitCode = 0;
  try {
    exitCode = await runMain();
  } catch (e) {
    if (e instanceof CliProcessExitError && e.isCliProcessExitError) {
      exitCode = e.code;
    } else {
      throw e;
    }
  } finally {
    await disposeWalletCliDmkTransportFully();
  }
  process.exit(exitCode);
}
