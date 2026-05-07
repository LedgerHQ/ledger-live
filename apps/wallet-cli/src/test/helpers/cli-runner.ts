/**
 * In-process CLI runner for tests.
 *
 * Instead of spawning a `bun` subprocess per test invocation (each costing ~0.5s for module
 * loading), this module imports the CLI once per Bun test-worker and calls runMain() directly.
 * Subsequent calls cost ~5–10ms instead of ~500ms.
 *
 * Isolation guarantees:
 *   - Tests within a file run sequentially (Bun default), so stdout/stderr capture,
 *     env-var patching, and DMK state are safe without locks.
 *   - Each test file runs in a separate Bun worker with its own module scope,
 *     so module-level state is isolated across files.
 *
 * HTTP interception:
 *   Installed once per worker (idempotent). Uses a module-level variable for the current
 *   mock port so different tests can use different ports without re-patching globals.
 */

import path from "node:path";
import { CliProcessExitError } from "../../cli-process-exit-error";
import { installOutputCapture } from "../../shared/ui";

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
type SetTestDmkTransportFn = (transport: unknown) => void;

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
// HTTP interceptor — installed once, port updated per invocation
// ---------------------------------------------------------------------------

let interceptorsInstalled = false;
let currentMockPort: number | null = null;

function resolveHttpArgs(
  base: Record<string, unknown>,
  firstArg: unknown,
  rest: unknown[],
): [Record<string, unknown>, ((...a: unknown[]) => unknown) | undefined] {
  if (
    (typeof firstArg === "string" || firstArg instanceof URL) &&
    rest.length > 0 &&
    typeof rest[0] !== "function"
  ) {
    const extra = rest[0] as Record<string, unknown>;
    const merged = {
      ...base,
      ...(extra.method != null ? { method: extra.method } : {}),
      ...(extra.headers != null ? { headers: extra.headers } : {}),
    };
    return [merged, rest[1] as ((...a: unknown[]) => unknown) | undefined];
  }
  return [base, rest[0] as ((...a: unknown[]) => unknown) | undefined];
}

function isLocal(url: string): boolean {
  return (
    url.startsWith("http://localhost") ||
    url.startsWith("https://localhost") ||
    url.startsWith("http://127.0.0.1") ||
    url.startsWith("https://127.0.0.1")
  );
}

async function installInterceptors(): Promise<void> {
  if (interceptorsInstalled) return;
  interceptorsInstalled = true;

  // ---- Layer 1: globalThis.fetch ----
  const origFetch = globalThis.fetch;
  (globalThis as Record<string, unknown>).fetch = (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    if (currentMockPort === null) return origFetch(input, init);
    const urlStr =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;
    if (urlStr && !isLocal(urlStr)) {
      const u = new URL(urlStr);
      const redirected = `http://localhost:${currentMockPort}${u.pathname}${u.search}`;
      if (input instanceof Request) {
        return origFetch(new Request(redirected, input), init);
      }
      return origFetch(redirected, init);
    }
    return origFetch(input, init);
  };

  // ---- Axios: force fetch adapter so it goes through the patched globalThis.fetch ----
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const liveCommonDir = path.dirname(require.resolve("@ledgerhq/live-common/package.json"));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const axiosPkgDir = path.dirname(
      require.resolve("axios/package.json", { paths: [liveCommonDir] }),
    );
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    (require(path.join(axiosPkgDir, "dist/node/axios.cjs")) as any).defaults.adapter = "fetch";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((await import(path.join(axiosPkgDir, "index.js"))) as any).default.defaults.adapter = "fetch";
  } catch {
    // axios not present — no action needed
  }

  // ---- Layer 2: node:http / node:https ----
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const http = require("node:http");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const https = require("node:https");
  const origHttpRequest = http.request.bind(http);
  const origHttpsRequest = https.request.bind(https);

  function buildMockOptions(options: unknown): Record<string, unknown> {
    if (typeof options === "string" || options instanceof URL) {
      const u = new URL(typeof options === "string" ? options : (options as URL).href);
      return {
        hostname: "localhost",
        port: currentMockPort,
        path: u.pathname + u.search,
        method: "GET",
      };
    }
    const o = options as Record<string, unknown>;
    return {
      hostname: "localhost",
      port: currentMockPort,
      path: (o.path as string) ?? "/",
      method: (o.method as string) ?? "GET",
      headers: (o.headers as Record<string, unknown>) ?? {},
    };
  }

  function isExternalOptions(options: unknown): boolean {
    if (currentMockPort === null) return false;
    if (typeof options === "string" || options instanceof URL) {
      const s = typeof options === "string" ? options : (options as URL).href;
      return !isLocal(s);
    }
    if (options && typeof options === "object") {
      const o = options as Record<string, unknown>;
      const host: string = (o.hostname as string) ?? ((o.host as string) ?? "").split(":")[0];
      return Boolean(host) && host !== "localhost" && host !== "127.0.0.1";
    }
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (http as any).request = function (options: unknown, ...rest: unknown[]) {
    if (isExternalOptions(options)) {
      const [mockOpts, cb] = resolveHttpArgs(buildMockOptions(options), options, rest);
      return origHttpRequest(mockOpts as unknown as Parameters<typeof http.request>[0], cb);
    }
    return origHttpRequest(options, ...rest);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (https as any).request = function (options: unknown, ...rest: unknown[]) {
    if (!isExternalOptions(options)) {
      return origHttpsRequest(options as Parameters<typeof https.request>[0], ...rest);
    }
    const [mockOpts, cb] = resolveHttpArgs(buildMockOptions(options), options, rest);
    return origHttpRequest(mockOpts as unknown as Parameters<typeof http.request>[0], cb);
  };
}

// ---------------------------------------------------------------------------
// DMK mock helpers
// ---------------------------------------------------------------------------

/**
 * Build a mock DMK transport from the env vars used by the subprocess wrapper.
 * Returns true if mocking was installed (so we know to clean up in finally).
 */
async function setupDmkMock(
  env: Record<string, string>,
  setTestDmkTransport: SetTestDmkTransportFn,
): Promise<boolean> {
  if (!env.WALLET_CLI_MOCK_DMK) return false;

  const stateEnv = (env.WALLET_CLI_MOCK_DMK_STATE ?? "connected") as "connected" | "locked";
  const appResults: Record<string, Record<string, unknown>> = env.WALLET_CLI_MOCK_APP_RESULTS
    ? (JSON.parse(env.WALLET_CLI_MOCK_APP_RESULTS) as Record<string, Record<string, unknown>>)
    : {};

  const [{ MockDeviceManagementKit }, { WalletCliDmkTransport }] = await Promise.all([
    import("../../device/mock-dmk"),
    import("../../device/wallet-cli-dmk-transport"),
  ]);

  const mock = new MockDeviceManagementKit({ initialState: stateEnv, appResults });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transport = new WalletCliDmkTransport(mock as any, "mock-session-id");
  setTestDmkTransport(transport);
  return true;
}

// ---------------------------------------------------------------------------
// Env var helpers
// ---------------------------------------------------------------------------

function applyEnv(env: Record<string, string>): Record<string, string | undefined> {
  const saved: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(env)) {
    saved[k] = process.env[k];
    process.env[k] = v;
  }
  return saved;
}

function restoreEnv(saved: Record<string, string | undefined>): void {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
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
  //   NO_COLOR=1     — disable ANSI escape codes in output
  //   CLAUDECODE=1   — triggers isInteractive() === false → disables spinner
  const mergedEnv: Record<string, string> = {
    NO_COLOR: "1",
    CLAUDECODE: "1",
    ...env,
  };

  // 0. Lazy-load the CLI module graph (once per worker; cached after first call).
  //    Doing this lazily ensures module-resolution failures appear as individual
  //    test errors rather than a file-level "Unhandled error between tests".
  const { runMain, setTestDmkTransport } = await getCliModules();

  // 1. HTTP interceptor: install once, update port per call
  if (mergedEnv.WALLET_CLI_MOCK_PORT) {
    await installInterceptors();
    currentMockPort = Number(mergedEnv.WALLET_CLI_MOCK_PORT);
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
    if (e instanceof CliProcessExitError && e.isCliProcessExitError) {
      exitCode = e.code;
    } else {
      throw e;
    }
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
      currentMockPort = null;
    }
  }

  return {
    stdout: outChunks.join("").trim(),
    stderr: errChunks.join("").trim(),
    exitCode,
  };
}
