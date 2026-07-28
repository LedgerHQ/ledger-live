import { ElectronApplication, Page, ConsoleMessage, Request, Response } from "@playwright/test";

interface ConsoleLog {
  timestamp: string;
  level: string;
  text: string;
}

interface NetworkLog {
  timestamp: string;
  method: string;
  url: string;
  pending: boolean;
  status?: number;
  duration?: number;
  postData?: string;
  responseBody?: string;
  failureText?: string;
}

export class PageLogCollector {
  private readonly consoleLogs: ConsoleLog[] = [];
  private readonly requestsMap: Map<Request, NetworkLog> = new Map();

  private targetPage: Page | null = null;
  private readonly attachedPages: Set<Page> = new Set();

  // Signatures of a swap-init failure the swap live-app surfaces over wallet-api
  // (custom.exchange.swap). This is the QAA-1326 root cause behind a device stranded on
  // "Exchange app is ready": it appears ONLY in the webview console, never in the network log
  // (the swap backend calls return 200). Kept in sync with the hint in speculos.ts.
  private static readonly SWAP_INIT_ERROR_SIGNATURES = [
    "CompleteExchangeError",
    "PayloadStepError",
    "FeeNotLoaded",
    "SWAP_NOT_CREATED_ERROR",
  ];

  private readonly onConsole = (msg: ConsoleMessage) => {
    this.consoleLogs.push({
      timestamp: new Date().toISOString(),
      level: msg.type(),
      text: msg.text(),
    });
  };

  private readonly onRequest = (request: Request) => {
    const requestUrl = request.url();
    // skip file://, data:, devtools:, ...
    if (/^https?:\/\//.test(requestUrl)) {
      this.requestsMap.set(request, {
        timestamp: new Date().toISOString(),
        method: request.method(),
        url: requestUrl,
        pending: true,
      });
    }
  };

  private readonly onResponse = async (response: Response) => {
    const request = response.request();
    const logEntry = this.requestsMap.get(request);

    if (logEntry) {
      logEntry.status = response.status();
    }
  };

  private readonly onRequestFinished = async (request: Request) => {
    const response = await request.response();
    const logEntry = this.requestsMap.get(request);

    if (logEntry) {
      logEntry.pending = false;
      logEntry.status = response?.status();
      logEntry.duration = Date.now() - new Date(logEntry.timestamp).getTime();

      if (response && response.status() >= 400) {
        try {
          // capture data for 4xx and 5xx for debugging
          logEntry.postData = request.postData() ?? "";
          logEntry.responseBody = await response.text();
        } catch (error) {
          logEntry.responseBody = `Failed to get response body: ${error}`;
        }
      }
    }
  };

  private readonly onRequestFailed = async (request: Request) => {
    const response = await request.response();
    const logEntry = this.requestsMap.get(request);

    if (logEntry) {
      logEntry.pending = false;
      logEntry.status = response?.status();
      logEntry.duration = Date.now() - new Date(logEntry.timestamp).getTime();
      logEntry.failureText = request.failure()?.errorText ?? "";

      if (response && response.status() >= 400) {
        try {
          // capture data for 4xx and 5xx for debugging
          logEntry.postData = request.postData() ?? "";
          logEntry.responseBody = await response.text();
        } catch (error) {
          logEntry.responseBody = `Failed to get response body: ${error}`;
        }
      }
    }
  };

  attach(page: Page): void {
    this.targetPage = page;
    page.on("console", this.onConsole);
    page.on("request", this.onRequest);
    page.on("response", this.onResponse);
    page.on("requestfinished", this.onRequestFinished);
    page.on("requestfailed", this.onRequestFailed);
  }

  attachWebview(electronApp: ElectronApplication): void {
    const [mainWindow] = electronApp.windows();
    const attachIfWebview = (page: Page) => {
      if (page === mainWindow || this.attachedPages.has(page)) return;
      this.attachedPages.add(page);
      this.attach(page);
    };
    electronApp.windows().forEach(attachIfWebview);
    electronApp.on("window", attachIfWebview);
  }

  getFormattedConsoleLogs(): string {
    if (this.consoleLogs.length === 0) return "";

    return this.consoleLogs
      .map(entry => `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.text}`)
      .join("\n");
  }

  /**
   * Extract the swap-init failure (custom.exchange.swap error) from the captured webview
   * console, if present, so the QAA-1326 root cause can be surfaced as its own attachment
   * instead of being buried in the full console dump. Returns null when no such error was seen.
   */
  getSwapInitError(): string | null {
    const matches = this.consoleLogs.filter(entry =>
      PageLogCollector.SWAP_INIT_ERROR_SIGNATURES.some(sig => entry.text.includes(sig)),
    );
    if (matches.length === 0) return null;

    return matches
      .map(entry => `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.text}`)
      .join("\n\n");
  }

  getFormattedNetworkLogs(): string {
    // Always return valid JSON: an empty map serializes to "[]", which keeps the
    // application/json attachment parseable instead of an empty (invalid) body.
    const logEntriesArray = Array.from(this.requestsMap.values());
    return JSON.stringify(logEntriesArray, null, 2);
  }
}
