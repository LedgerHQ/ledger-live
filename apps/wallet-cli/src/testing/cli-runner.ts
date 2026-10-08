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
 *   - Because module mocks are global and cannot be undone, a test file that has to mock a
 *     module also imported by these CLI runs uses `createGatedModuleMock` (see
 *     `gated-module-mock.ts`), so other files keep the real module.
 *
 * HTTP interception:
 *   Installed while a mock port is set and removed when it is cleared, so tests that run
 *   without one see the real fetch, http(s).request and axios adapter. A module-level
 *   variable holds the current port.
 */

import path from "node:path";
import { getCliProcessExitCode } from "../cli-process-exit-error";
import { installOutputCapture } from "../shared/ui";
import { InMemoryKeychain } from "./in-memory-keychain";

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
type SetTestKeychainFn = typeof import("../key-ring/keychain-entry")._setTestKeychain;
type ResetApiAuthIdentityFn = () => void;

let _runMain: RunMainFn | null = null;
let _setTestDmkTransport: SetTestDmkTransportFn | null = null;
let _setTestKeychain: SetTestKeychainFn | null = null;
let _resetApiAuthIdentity: ResetApiAuthIdentityFn | null = null;

/**
 * Keychain `runCli` gives the CLI unless the test installed its own with `_setTestKeychain`, so runs
 * never touch the developer's real keychain. Entries are keyed by account, one per XDG_STATE_HOME.
 */
const runCliKeychain = new InMemoryKeychain();

/** Points the keychain seam at the test's own keychain, or else at `runCliKeychain`; returns the undo. */
function useRunCliKeychain(setTestKeychain: SetTestKeychainFn): () => void {
  const testKeychain = setTestKeychain(runCliKeychain.open);
  if (testKeychain) setTestKeychain(testKeychain);
  return () => {
    setTestKeychain(testKeychain);
  };
}

/** Public key of the API auth key stored for the profile at `XDG_STATE_HOME`, if any. */
export async function storedApiAuthPubkey(env: {
  XDG_STATE_HOME: string;
}): Promise<string | undefined> {
  const [
    { apiAuthKeychainAccount },
    { pubkeyFromPrivatekey },
    { _setTestKeychain: setTestKeychain, openKeychainEntry },
    { APP_NAME },
  ] = await Promise.all([
    import("../key-ring/api-auth-identity"),
    import("../key-ring/crypto"),
    import("../key-ring/keychain-entry"),
    import("../session/session-store"),
  ]);
  const saved = applyEnv(env);
  const restoreKeychain = useRunCliKeychain(setTestKeychain);
  try {
    const privatekey = openKeychainEntry(APP_NAME, apiAuthKeychainAccount()).getPassword();
    return privatekey ? pubkeyFromPrivatekey(privatekey) : undefined;
  } finally {
    restoreKeychain();
    restoreEnv(saved);
  }
}

async function getCliModules(): Promise<{
  runMain: RunMainFn;
  setTestDmkTransport: SetTestDmkTransportFn;
  setTestKeychain: SetTestKeychainFn;
  resetApiAuthIdentity: ResetApiAuthIdentityFn;
}> {
  if (!_runMain) {
    // These imports load the CLI module graph (live-common-setup, the command registry, etc.);
    // commands load on first use, as in the CLI. They run once per Bun test-worker; the module
    // system caches the result.
    const [cliMod, dmkMod, apiAuthMod, keychainMod] = await Promise.all([
      import("../cli"),
      import("../device/register-dmk-transport"),
      import("../key-ring/api-auth-identity"),
      import("../key-ring/keychain-entry"),
    ]);
    _runMain = cliMod.runMain;
    _setTestDmkTransport = dmkMod._setTestDmkTransport as SetTestDmkTransportFn;
    _setTestKeychain = keychainMod._setTestKeychain;
    _resetApiAuthIdentity = apiAuthMod._resetApiAuthIdentity;
  }
  return {
    runMain: _runMain!,
    setTestDmkTransport: _setTestDmkTransport!,
    setTestKeychain: _setTestKeychain!,
    resetApiAuthIdentity: _resetApiAuthIdentity!,
  };
}

// ---------------------------------------------------------------------------
// HTTP interceptor — installed while a mock port is set
// ---------------------------------------------------------------------------

let uninstallInterceptors: (() => void) | null = null;
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

type AxiosModule = { defaults: { adapter?: unknown } };

/** Defaults of the axios live-common uses, CommonJS and ESM builds; empty without axios. */
export async function liveCommonAxiosDefaults(): Promise<AxiosModule["defaults"][]> {
  const found: AxiosModule["defaults"][] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const liveCommonDir = path.dirname(require.resolve("@ledgerhq/live-common/package.json"));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const axiosPkgDir = path.dirname(
      require.resolve("axios/package.json", { paths: [liveCommonDir] }),
    );
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cjs = require(path.join(axiosPkgDir, "dist/node/axios.cjs")) as AxiosModule;
    found.push(cjs.defaults);
    const esm = (await import(path.join(axiosPkgDir, "index.js"))) as { default: AxiosModule };
    found.push(esm.default.defaults);
  } catch {
    // axios not present — nothing to patch
  }
  return found;
}

/** Patches fetch, axios and http(s).request; returns the function that puts the originals back. */
async function installInterceptors(): Promise<() => void> {
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
  const axiosDefaults = await liveCommonAxiosDefaults();
  const origAxiosAdapters = axiosDefaults.map(defaults => defaults.adapter);
  for (const defaults of axiosDefaults) defaults.adapter = "fetch";

  // ---- Layer 2: node:http / node:https ----
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const http = require("node:http");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const https = require("node:https");
  const origHttpRequestFn = http.request;
  const origHttpsRequestFn = https.request;
  const origHttpRequest = origHttpRequestFn.bind(http);
  const origHttpsRequest = origHttpsRequestFn.bind(https);

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
      path: o.path ?? "/",
      method: o.method ?? "GET",
      headers: o.headers ?? {},
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

  return () => {
    globalThis.fetch = origFetch;
    axiosDefaults.forEach((defaults, i) => {
      defaults.adapter = origAxiosAdapters[i];
    });
    http.request = origHttpRequestFn;
    https.request = origHttpsRequestFn;
  };
}

/**
 * Redirects external `fetch` and `http(s).request` calls to `localhost:<port>`; `null` stops it and
 * restores the originals.
 */
export async function redirectHttpTo(port: number | null): Promise<void> {
  if (port === null) {
    stopRedirectingHttp();
    return;
  }
  uninstallInterceptors ??= await installInterceptors();
  currentMockPort = port;
}

function stopRedirectingHttp(): void {
  currentMockPort = null;
  uninstallInterceptors?.();
  uninstallInterceptors = null;
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
    import("../device/mock-dmk"),
    import("../device/wallet-cli-dmk-transport"),
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
 * Module loading (live-common-setup, each command on first use) happens once per worker.
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
  const { runMain, setTestDmkTransport, setTestKeychain, resetApiAuthIdentity } =
    await getCliModules();

  // Each run loads the API auth key again, as a new process would.
  resetApiAuthIdentity();

  // A step that can throw registers its undo before the next one starts, so a failure still unwinds
  // the steps before it and no patched global outlives this run.
  const cleanups: (() => void)[] = [];
  const outChunks: string[] = [];
  const errChunks: string[] = [];
  let exitCode = 0;
  try {
    // 1. HTTP interceptor
    if (mergedEnv.WALLET_CLI_MOCK_PORT) {
      cleanups.push(stopRedirectingHttp);
      await redirectHttpTo(Number(mergedEnv.WALLET_CLI_MOCK_PORT));
    }

    // 2. DMK mock transport
    if (await setupDmkMock(mergedEnv, setTestDmkTransport)) {
      cleanups.push(() => setTestDmkTransport(null));
    }

    // 3. Temporary env vars (XDG_STATE_HOME, etc.)
    const savedEnv = applyEnv(mergedEnv);
    // 4. Capture wallet-cli stdout / stderr without patching process-global streams.
    const restoreOutputCapture = installOutputCapture({
      stdout: chunk => {
        outChunks.push(chunk);
      },
      stderr: chunk => {
        errChunks.push(chunk);
      },
    });
    // 5. Keychain: the test's own, or the in-memory one
    const restoreKeychain = useRunCliKeychain(setTestKeychain);
    // Steps 3–5 only assign variables and cannot throw, so they register their undo together.
    cleanups.push(() => restoreEnv(savedEnv), restoreOutputCapture, restoreKeychain);

    exitCode = await runMain(args);
  } catch (e) {
    const code = getCliProcessExitCode(e);
    if (code === null) throw e;
    exitCode = code;
  } finally {
    for (const cleanup of cleanups.toReversed()) cleanup();
  }

  return {
    stdout: outChunks.join("").trim(),
    stderr: errChunks.join("").trim(),
    exitCode,
  };
}
