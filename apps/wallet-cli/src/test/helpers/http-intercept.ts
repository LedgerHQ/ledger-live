/**
 * Test-only HTTP interceptor. Import before the CLI entry point.
 * Requires WALLET_CLI_MOCK_PORT in process.env.
 *
 * Two interception layers:
 *   1. globalThis.fetch  — all fetch-based callers and axios (forced to fetch adapter)
 *   2. node:http/https   — fallback for any remaining node:http callers
 *
 * Axios uses node:http adapter by default in Bun (process is defined). We force it
 * onto the fetch adapter so its calls go through the globalThis.fetch patch below.
 * axios is not a direct dep of wallet-cli, so we resolve it via @ledgerhq/coin-evm
 * (which is) and patch both CJS and ESM instances.
 */
import path from "node:path";

const mockPort = process.env.WALLET_CLI_MOCK_PORT;
if (!mockPort) {
  throw new Error("[http-intercept] WALLET_CLI_MOCK_PORT is not set");
}

const mockBase = `http://localhost:${mockPort}`;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const coinEvmDir = path.dirname(require.resolve("@ledgerhq/coin-evm/package.json"));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const axiosPkgDir = path.dirname(require.resolve("axios/package.json", { paths: [coinEvmDir] }));

// Patch CJS axios instance
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
(require(path.join(axiosPkgDir, "dist/node/axios.cjs")) as any).defaults.adapter = "fetch";
// Patch ESM axios instance (coin-evm's `import axios from "axios"` resolves here)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
((await import(path.join(axiosPkgDir, "index.js"))) as any).default.defaults.adapter = "fetch";

function isLocal(urlStr: string): boolean {
  return (
    urlStr.startsWith("http://localhost") ||
    urlStr.startsWith("https://localhost") ||
    urlStr.startsWith("http://127.0.0.1") ||
    urlStr.startsWith("https://127.0.0.1")
  );
}

// ---------------------------------------------------------------------------
// Layer 1: globalThis.fetch
// ---------------------------------------------------------------------------
const origFetch = globalThis.fetch;
(globalThis as Record<string, unknown>).fetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => {
  const urlStr =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : (input as Request).url;
  if (urlStr && !isLocal(urlStr)) {
    const u = new URL(urlStr);
    const redirected = `${mockBase}${u.pathname}${u.search}`;
    if (input instanceof Request) {
      // Preserve the original request's method/headers/body; apply caller's init on top.
      return origFetch(new Request(redirected, input), init);
    }
    return origFetch(redirected, init);
  }
  return origFetch(input, init);
};

// ---------------------------------------------------------------------------
// Layer 2: node:http / node:https — fallback for non-fetch callers.
// HTTPS requests are redirected to the plain-HTTP mock server.
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-require-imports
const http = require("node:http") as typeof import("node:http");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const https = require("node:https") as typeof import("node:https");

const origHttpRequest = http.request.bind(http);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMockOptions(options: any): Record<string, unknown> {
  if (typeof options === "string" || options instanceof URL) {
    const u = new URL(typeof options === "string" ? options : (options as URL).href);
    return { hostname: "localhost", port: Number(mockPort), path: u.pathname + u.search, method: "GET" };
  }
  return {
    hostname: "localhost",
    port: Number(mockPort),
    path: options.path ?? "/",
    method: options.method ?? "GET",
    headers: options.headers ?? {},
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isExternalOptions(options: any): boolean {
  if (typeof options === "string" || options instanceof URL) {
    const s = typeof options === "string" ? options : (options as URL).href;
    return !isLocal(s);
  }
  if (options && typeof options === "object") {
    const host: string = options.hostname ?? (options.host ?? "").split(":")[0];
    return Boolean(host) && host !== "localhost" && host !== "127.0.0.1";
  }
  return false;
}

// Resolves the correct [mergedOptions, callback] pair from the Node http.request overloads:
//   (options[, callback])
//   (url[, options][, callback])
// When the first arg is a URL/string and rest[0] is a non-function, it is an options object.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveHttpArgs(base: Record<string, unknown>, firstArg: any, rest: any[]): [Record<string, unknown>, ((...a: unknown[]) => unknown) | undefined] {
  if ((typeof firstArg === "string" || firstArg instanceof URL) && rest.length > 0 && typeof rest[0] !== "function") {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(http as any).request = function (options: any, ...rest: any[]) {
  if (isExternalOptions(options)) {
    const [mockOpts, cb] = resolveHttpArgs(buildMockOptions(options), options, rest);
    return origHttpRequest(mockOpts as unknown as Parameters<typeof http.request>[0], cb);
  }
  return origHttpRequest(options, ...rest);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(https as any).request = function (options: any, ...rest: any[]) {
  const [mockOpts, cb] = resolveHttpArgs(buildMockOptions(options), options, rest);
  return origHttpRequest(mockOpts as unknown as Parameters<typeof http.request>[0], cb);
};
