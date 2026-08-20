import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";

/**
 * Store for the main Ledger Wallet app's network logs collected during e2e tests.
 * Populated by an axios interceptor (message-only, no bodies) and attached to Allure
 * reports on failure — the app-side counterpart to the desktop network log collector.
 */

export interface AppNetworkLog {
  timestamp: string;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  failureText?: string;
  /** Which client issued it. `fetch` covers RTK Query, and therefore all CAL traffic. */
  transport?: "axios" | "fetch";
  /** Requests already in flight when this one started — makes fan-out visible. */
  inFlight?: number;
}

/** Peak concurrency and per-host counts, so a fan-out is legible without reading every entry. */
export interface AppNetworkSummary {
  total: number;
  peakInFlight: number;
  byHost: Record<string, number>;
}

// A single `currency.list` can issue several hundred CAL lookups, which would evict
// everything else from a smaller buffer. `getSummary()` carries the totals regardless,
// so this only needs to be large enough to keep the surrounding traffic readable.
const MAX_NETWORK_LOGS = 1500;

const networkLogs: AppNetworkLog[] = [];
let inFlight = 0;
let peakInFlight = 0;
let total = 0;
const byHost: Record<string, number> = {};

function hostOf(url: string): string {
  const match = /^[a-z]+:\/\/([^/?#]+)/i.exec(url);
  return match ? match[1] : "(relative)";
}

export const appNetworkLogStore = {
  addNetworkLog(entry: AppNetworkLog) {
    networkLogs.unshift(entry);
    while (networkLogs.length > MAX_NETWORK_LOGS) {
      networkLogs.pop();
    }
  },

  getNetworkLogs(): AppNetworkLog[] {
    return [...networkLogs];
  },

  getSummary(): AppNetworkSummary {
    return { total, peakInFlight, byHost: { ...byHost } };
  },

  clear() {
    networkLogs.length = 0;
    inFlight = 0;
    peakInFlight = 0;
    total = 0;
    for (const key of Object.keys(byHost)) delete byHost[key];
  },
};

/** Counts a request as started and returns the in-flight depth at that moment. */
function requestStarted(url: string): number {
  inFlight += 1;
  total += 1;
  peakInFlight = Math.max(peakInFlight, inFlight);
  const host = hostOf(url);
  byHost[host] = (byHost[host] ?? 0) + 1;
  return inFlight;
}

function requestFinished(): void {
  inFlight = Math.max(0, inFlight - 1);
}

type WithMetadata = InternalAxiosRequestConfig & {
  metadata?: { startTime: number; inFlight?: number };
};

function toNetworkLog(
  config: WithMetadata | undefined,
  status?: number,
  failureText?: string,
): AppNetworkLog {
  const startTime = config?.metadata?.startTime ?? Date.now();
  return {
    timestamp: new Date().toISOString(),
    method: (config?.method ?? "").toUpperCase(),
    url: `${config?.baseURL ?? ""}${config?.url ?? ""}`.split(/[?#]/)[0],
    status,
    duration: Date.now() - startTime,
    failureText,
    transport: "axios",
    inFlight: (config as WithMetadata & { metadata?: { inFlight?: number } })?.metadata?.inFlight,
  };
}

let initialized = false;

/** Register axios interceptors that record the app's network calls (message-only, no bodies). */
export function initAppNetworkLogging(): void {
  if (initialized) return;
  initialized = true;

  axios.interceptors.request.use(function (config) {
    const url = `${config.baseURL ?? ""}${config.url ?? ""}`;
    (config as WithMetadata).metadata = { startTime: Date.now(), inFlight: requestStarted(url) };
    return config;
  });

  patchFetch();

  axios.interceptors.response.use(
    function (response: AxiosResponse) {
      requestFinished();
      try {
        appNetworkLogStore.addNetworkLog(
          toNetworkLog(response.config as WithMetadata, response.status),
        );
      } catch {
        // Ignore logging errors: the interceptor must never fail the network call
      }
      return response;
    },
    function (error: AxiosError) {
      requestFinished();
      try {
        appNetworkLogStore.addNetworkLog(
          toNetworkLog(
            error.config as WithMetadata | undefined,
            error.response?.status,
            error.message,
          ),
        );
      } catch {
        // Ignore logging errors: the interceptor must never fail the network call
      }
      return Promise.reject(error);
    },
  );
}

/**
 * Wrap global `fetch`.
 *
 * The axios interceptors above miss every request made through RTK Query, which uses
 * `fetch` — and that includes all CAL token lookups. Until this existed, a `currency.list`
 * fan-out of ~630 requests was completely absent from the "Ledger Wallet Network Logs"
 * attachment, which made it impossible to tell a bounded fan-out from an unbounded one
 * when reading a CI artifact. Only installed under Config.DETOX, via initAppNetworkLogging.
 */
function patchFetch(): void {
  const original = globalThis.fetch;
  if (typeof original !== "function") return;

  globalThis.fetch = async function patchedFetch(input: RequestInfo | URL, init?: RequestInit) {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method ??
      (typeof input === "object" && "method" in input ? input.method : "GET")) as string;
    const startTime = Date.now();
    const depth = requestStarted(url);

    try {
      const response = await original.call(globalThis, input as RequestInfo, init);
      appNetworkLogStore.addNetworkLog({
        timestamp: new Date().toISOString(),
        method: method.toUpperCase(),
        url: url.split(/[?#]/)[0],
        status: response.status,
        duration: Date.now() - startTime,
        transport: "fetch",
        inFlight: depth,
      });
      return response;
    } catch (error) {
      appNetworkLogStore.addNetworkLog({
        timestamp: new Date().toISOString(),
        method: method.toUpperCase(),
        url: url.split(/[?#]/)[0],
        duration: Date.now() - startTime,
        failureText: error instanceof Error ? error.message : String(error),
        transport: "fetch",
        inFlight: depth,
      });
      throw error;
    } finally {
      requestFinished();
    }
  };
}
