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
}

const MAX_NETWORK_LOGS = 500;

const networkLogs: AppNetworkLog[] = [];

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

  clear() {
    networkLogs.length = 0;
  },
};

type WithMetadata = InternalAxiosRequestConfig & { metadata?: { startTime: number } };

function toNetworkLog(
  config: WithMetadata | undefined,
  status?: number,
  failureText?: string,
): AppNetworkLog {
  const startTime = config?.metadata?.startTime ?? Date.now();
  return {
    timestamp: new Date().toISOString(),
    method: (config?.method ?? "").toUpperCase(),
    url: `${config?.baseURL ?? ""}${config?.url ?? ""}`,
    status,
    duration: Date.now() - startTime,
    failureText,
  };
}

let initialized = false;

/** Register axios interceptors that record the app's network calls (message-only, no bodies). */
export function initAppNetworkLogging(): void {
  if (initialized) return;
  initialized = true;

  axios.interceptors.request.use(function (config) {
    (config as WithMetadata).metadata = { startTime: Date.now() };
    return config;
  });

  axios.interceptors.response.use(
    function (response: AxiosResponse) {
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
