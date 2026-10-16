#!/usr/bin/env bun
import "@shared/env";
import "./embed-usb-native";
import { resolve } from "node:path";
import { createCLI } from "@bunli/core";
import "./live-common-setup";
import { emitTestingBuildBannerIfNeeded } from "./shared/testing-build-banner";
import { maybeShowFirstRunNudge } from "./shared/first-run-nudge";
import bunliConfig from "../bunli.config";
import { disposeAnalytics, startAnalytics } from "./analytics/segment";
import { withCommandLifecycleAnalytics } from "./analytics/lifecycle-analytics";
import { loadCommands } from "./commands/registry";
import { disposeWalletCliDmkTransportFully } from "./device/register-dmk-transport";
import { setupWalletCliStore } from "./state-manager/configureStore";

emitTestingBuildBannerIfNeeded();

/**
 * Runs the CLI in-process. Called by the test runner directly (no subprocess).
 *
 * Using noExit:true on bunli's run() means bunli returns a numeric exit code
 * instead of calling process.exit(). Any CliProcessExitError thrown by output.ts
 * is caught here so the caller gets a clean numeric code back.
 */
export async function runMain(argv: string[] = process.argv.slice(2)): Promise<number> {
  setupWalletCliStore();
  const cli = await createCLI(bunliConfig as unknown as Parameters<typeof createCLI>[0]);
  for (const command of await loadCommands(argv)) cli.command(command);
  maybeShowFirstRunNudge(argv);
  const code = await cli.run(normalizeNegatedFlags(argv), { noExit: true });
  return code ?? 0;
}

// bunli silently drops unknown --no-foo flags; rewrite to --foo=false for GNU-style negation.
function normalizeNegatedFlags(argv: string[]): string[] {
  return argv.map(arg => (arg.startsWith("--no-") ? `--${arg.slice(5)}=false` : arg));
}

if (import.meta.main) {
  // The dev launcher (`pnpm wallet-cli start`) runs from the package dir, so fall back to INIT_CWD
  // (where pnpm was invoked). cwd === PACKAGE_ROOT only holds from source, never in the shipped
  // binary. Done once here so downstream code just resolves against process.cwd().
  const PACKAGE_ROOT = resolve(import.meta.dir, "..");
  if (process.cwd() === PACKAGE_ROOT && process.env.INIT_CWD) {
    try {
      process.chdir(process.env.INIT_CWD);
    } catch {
      // Stale/removed INIT_CWD: keep the current cwd rather than crash every command at startup.
    }
  }
  const argv = normalizeNegatedFlags(process.argv.slice(2));
  try {
    startAnalytics();
    process.exitCode = await withCommandLifecycleAnalytics(argv, () => runMain(argv));
  } finally {
    await disposeWalletCliDmkTransportFully();
    await disposeAnalytics();
  }
}
