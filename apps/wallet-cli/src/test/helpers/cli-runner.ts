/**
 * In-process CLI runner for tests.
 *
 * Instead of spawning a `bun` subprocess per test invocation (each costing ~0.5s for module
 * loading), this module imports the CLI once per Bun test-worker and calls runMain() directly.
 * Subsequent calls cost ~5–10ms instead of ~500ms.
 *
 * Concurrency / state notes:
 *   - `bun test` runs every test file in a single process, sequentially. There is no
 *     per-file worker isolation: module-level state (the cached CLI graph below, the
 *     HTTP interceptor, and any `mock.module(...)` registrations) is SHARED across files.
 *   - Within that single process, tests run one at a time, so stdout/stderr capture,
 *     env-var patching, and DMK state are safe without locks as long as each call cleans
 *     up after itself (see the `finally` block in runCli).
 *   - Because module mocks are global, any test file that `mock.module(...)`s a module
 *     also imported by these CLI runs must restore it (or avoid mocking shared modules)
 *     so it does not bleed into other files.
 *
 * HTTP interception:
 *   Installed once per worker (idempotent). Uses a module-level variable for the current
 *   mock port so different tests can use different ports without re-patching globals.
 */

import { getCliProcessExitCode } from "../../cli-process-exit-error";
import { installOutputCapture } from "../../shared/ui";
import {
  applyEnv,
  clearMockPort,
  installInterceptors,
  restoreEnv,
  setMockPort,
  setupDmkMock,
  type SetTestDmkTransportFn,
} from "./mock-env";

// ---------------------------------------------------------------------------
// Lazy CLI loader — deferred until first runCliInProcess() call
//
// Importing cli.ts at module level would trigger live-common-setup.ts which in
// turn loads @ledgerhq/live-common and its transitive workspace deps. In pnpm
// workspace environments where packages are linked as source symlinks, those
// transitive deps may not be resolvable from their symlinked paths. Loading
// lazily means a module-resolution failure surfaces as an individual test error
// (consistent with the old Bun.spawn approach) rather than crashing the whole
// test file with an "Unhandled error between tests".
// ---------------------------------------------------------------------------

type RunMainFn = (argv: string[]) => Promise<number>;

let _runMain: RunMainFn | null = null;
let _setTestDmkTransport: SetTestDmkTransportFn | null = null;

async function getCliModules(): Promise<{
  runMain: RunMainFn;
  setTestDmkTransport: SetTestDmkTransportFn;
}> {
  if (!_runMain) {
    // These imports load the full CLI module graph (live-common-setup, commands.gen, etc.).
    // They run once per Bun test-worker; the module system caches the result.
    const [cliMod, dmkMod] = await Promise.all([
      import("../../cli"),
      import("../../device/register-dmk-transport"),
    ]);
    _runMain = cliMod.runMain;
    _setTestDmkTransport = dmkMod._setTestDmkTransport as SetTestDmkTransportFn;
  }
  return {
    runMain: _runMain!,
    setTestDmkTransport: _setTestDmkTransport!,
  };
}

// ---------------------------------------------------------------------------
// Core runner
// ---------------------------------------------------------------------------

export type RunResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
};

/**
 * Run the CLI in-process with the given argv and env overrides.
 * Captures stdout/stderr and returns them along with the exit code.
 *
 * This is the in-process equivalent of spawning `bun wrapper.ts ...args`.
 * Module loading (live-common-setup, commands.gen) happens once per worker.
 */
export async function runCli(args: string[], env: Record<string, string> = {}): Promise<RunResult> {
  // Mirror the env defaults set by the old Bun.spawn approach:
  //   NO_COLOR=1            — disable ANSI escape codes in output
  //   CLAUDECODE=1          — triggers isInteractive() === false → disables spinner
  //   WALLET_CLI_NO_NUDGE=1 — CLAUDECODE=1 would otherwise fire the first-run nudge
  //                           into unrelated tests' stderr; opt out by default.
  const mergedEnv: Record<string, string> = {
    NO_COLOR: "1",
    CLAUDECODE: "1",
    WALLET_CLI_NO_NUDGE: "1",
    ...env,
  };

  // 0. Lazy-load the CLI module graph (once per worker; cached after first call).
  //    Doing this lazily ensures module-resolution failures appear as individual
  //    test errors rather than a file-level "Unhandled error between tests".
  const { runMain, setTestDmkTransport } = await getCliModules();

  // 1. HTTP interceptor: install once, update port per call
  if (mergedEnv.WALLET_CLI_MOCK_PORT) {
    await installInterceptors();
    setMockPort(Number(mergedEnv.WALLET_CLI_MOCK_PORT));
  }

  // 2. DMK mock: set before run (cleared in finally)
  const dmkMockInstalled = await setupDmkMock(mergedEnv, setTestDmkTransport);

  // 3. Temporary env vars (XDG_STATE_HOME, etc.)
  const savedEnv = applyEnv(mergedEnv);

  // 4. Capture wallet-cli stdout / stderr without patching process-global streams.
  const outChunks: string[] = [];
  const errChunks: string[] = [];
  const restoreOutputCapture = installOutputCapture({
    stdout: chunk => {
      outChunks.push(chunk);
    },
    stderr: chunk => {
      errChunks.push(chunk);
    },
  });

  let exitCode = 0;
  try {
    exitCode = await runMain(args);
  } catch (e) {
    const code = getCliProcessExitCode(e);
    if (code === null) throw e;
    exitCode = code;
  } finally {
    restoreOutputCapture();

    // Restore env vars
    restoreEnv(savedEnv);

    // Clear DMK mock transport for next invocation
    if (dmkMockInstalled) {
      setTestDmkTransport(null);
    }

    // Reset mock port if we set it
    if (mergedEnv.WALLET_CLI_MOCK_PORT) {
      clearMockPort();
    }
  }

  return {
    stdout: outChunks.join("").trim(),
    stderr: errChunks.join("").trim(),
    exitCode,
  };
}
