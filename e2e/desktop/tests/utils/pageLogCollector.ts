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
  private readonly attachedPages: WeakSet<Page> = new WeakSet<Page>();

  // Swap-init failure signatures (QAA-1326): used to surface the root cause when swap-init stalls.
  private static readonly SWAP_INIT_ERROR_SIGNATURES = [
    "custom.exchange.swap",
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
   * Extract the swap-init failure (custom.exchange.swap request/response) from the captured
   * webview console, formatted for readability: `%c` console styling stripped, the embedded
   * JSON payload pretty-printed, and the noisy minified renderer stacks dropped. Null when none.
   */
  getSwapInitError(): string | null {
    const matches = this.consoleLogs.filter(entry =>
      PageLogCollector.SWAP_INIT_ERROR_SIGNATURES.some(sig => entry.text.includes(sig)),
    );
    if (matches.length === 0) return null;

    const step = PageLogCollector.deriveSwapInitStep(matches);
    const body = matches.map(entry => PageLogCollector.formatSwapInitEntry(entry)).join("\n\n");
    return step ? `Step: ${step}\n\n${body}` : body;
  }

  private static deriveSwapInitStep(matches: ConsoleLog[]): string | null {
    const text = matches.map(entry => entry.text).join(" ");
    if (text.includes("PayloadStepError") || text.includes("swap002")) {
      return "PAYLOAD (Backend Swap Payload Retrieval)";
    }
    if (text.includes("CompleteExchangeError")) {
      const deviceStep = text.match(/"step"\s*:\s*"([^"]+)"/)?.[1] ?? "INIT";
      return `device Exchange app (${deviceStep})`;
    }
    return null;
  }

  private static formatSwapInitEntry(entry: ConsoleLog): string {
    const header = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const jsonStart = entry.text.indexOf("{");
    if (jsonStart === -1) {
      return `${header} ${PageLogCollector.stripConsoleStyling(entry.text)}`;
    }

    const label = PageLogCollector.stripConsoleStyling(entry.text.slice(0, jsonStart));
    const rawJson = entry.text.slice(jsonStart);
    try {
      const pretty = JSON.stringify(PageLogCollector.dropStacks(JSON.parse(rawJson)), null, 2);
      return `${header} ${label}\n${pretty}`;
    } catch {
      // Not valid JSON (e.g. a plain log line) — keep the cleaned text as-is.
      return `${header} ${label} ${rawJson}`;
    }
  }

  /** Remove `%c` console format tokens and their CSS style arguments, keeping the label text. */
  private static stripConsoleStyling(text: string): string {
    return text
      .replace(/%c/g, "")
      .replace(/background:[^;]*;?/gi, "")
      .replace(/color:\s*#[0-9a-f]{3,8};?/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /** Recursively drop `stack` properties — the minified renderer stacks are noise for triage. */
  private static dropStacks(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map(item => PageLogCollector.dropStacks(item));
    }
    if (value !== null && typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        if (key === "stack") continue;
        result[key] = PageLogCollector.dropStacks(val);
      }
      return result;
    }
    return value;
  }

  getFormattedNetworkLogs(): string {
    // Always return valid JSON: an empty map serializes to "[]", which keeps the
    // application/json attachment parseable instead of an empty (invalid) body.
    const logEntriesArray = Array.from(this.requestsMap.values());
    return JSON.stringify(logEntriesArray, null, 2);
  }
}
