/**
 * Store for WebView network and console logs collected during e2e tests.
 * Used to attach webapp logs to Allure reports (similar to e2e/desktop WebviewLogCollector).
 * Also stores WebView load errors when the live app fails to load (for debugging).
 */

export interface WebviewNetworkLog {
  timestamp: string;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  failureText?: string;
}

export interface WebviewConsoleLog {
  timestamp: string;
  level: string;
  text: string;
}

export interface WebviewLoadError {
  timestamp: string;
  source: string;
  message: string;
  details?: string;
}

const MAX_NETWORK_LOGS = 500;
const MAX_CONSOLE_LOGS = 200;
const MAX_LOAD_ERRORS = 50;

const networkLogs: WebviewNetworkLog[] = [];
const consoleLogs: WebviewConsoleLog[] = [];
const loadErrors: WebviewLoadError[] = [];

export const webviewLogStore = {
  addNetworkLog(entry: WebviewNetworkLog) {
    networkLogs.unshift(entry);
    while (networkLogs.length > MAX_NETWORK_LOGS) {
      networkLogs.pop();
    }
  },

  addConsoleLog(entry: WebviewConsoleLog) {
    consoleLogs.unshift(entry);
    while (consoleLogs.length > MAX_CONSOLE_LOGS) {
      consoleLogs.pop();
    }
  },

  /** Record a WebView load error (onError, renderError) for e2e debugging when live app does not load */
  addLoadError(entry: WebviewLoadError) {
    loadErrors.unshift(entry);
    while (loadErrors.length > MAX_LOAD_ERRORS) {
      loadErrors.pop();
    }
  },

  getNetworkLogs(): WebviewNetworkLog[] {
    return [...networkLogs];
  },

  getConsoleLogs(): WebviewConsoleLog[] {
    return [...consoleLogs];
  },

  getLoadErrors(): WebviewLoadError[] {
    return [...loadErrors];
  },

  clear() {
    networkLogs.length = 0;
    consoleLogs.length = 0;
    loadErrors.length = 0;
  },
};
