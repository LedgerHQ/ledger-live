/**
 * Shared test-harness plumbing used by both the in-process CLI runner ([cli-runner.ts])
 * and the in-process MCP runner ([mcp-runner.ts]):
 *
 *   - HTTP interception: redirects any non-local http/https/fetch/axios request to a local
 *     MockServer port (installed once per Bun worker, port swapped per invocation).
 *   - DMK mock: builds a WalletCliDmkTransport backed by MockDeviceManagementKit from the same
 *     WALLET_CLI_MOCK_* env vars the subprocess wrapper used to consume.
 *   - Env var apply/restore.
 *
 * Both runners share the same module-level interceptor + port so a single worker can multiplex
 * CLI and MCP calls against different mock servers without re-patching globals.
 */

import path from "node:path";

// ---------------------------------------------------------------------------
// HTTP interceptor — installed once, port updated per invocation
// ---------------------------------------------------------------------------

let interceptorsInstalled = false;
let currentMockPort: number | null = null;

/** Point the interceptor at a MockServer port. */
export function setMockPort(port: number): void {
  currentMockPort = port;
}

/** Stop redirecting external requests (restores pass-through behavior). */
export function clearMockPort(): void {
  currentMockPort = null;
}

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

export async function installInterceptors(): Promise<void> {
  if (interceptorsInstalled) return;
  interceptorsInstalled = true;

  // ---- Layer 1: globalThis.fetch ----
  const origFetch = globalThis.fetch;
  (globalThis as Record<string, unknown>).fetch = (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    if (currentMockPort === null) return origFetch(input, init);
    let urlStr: string;
    if (typeof input === "string") urlStr = input;
    else if (input instanceof URL) urlStr = input.href;
    else urlStr = (input as Request).url;
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
}

// ---------------------------------------------------------------------------
// DMK mock helpers
// ---------------------------------------------------------------------------

export type SetTestDmkTransportFn = (transport: unknown) => void;

/**
 * Build a mock DMK transport from the env vars used by the subprocess wrapper.
 * Returns true if mocking was installed (so we know to clean up in finally).
 */
export async function setupDmkMock(
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

export function applyEnv(env: Record<string, string>): Record<string, string | undefined> {
  const saved: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(env)) {
    saved[k] = process.env[k];
    process.env[k] = v;
  }
  return saved;
}

export function restoreEnv(saved: Record<string, string | undefined>): void {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
}
