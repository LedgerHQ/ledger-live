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

export class WebviewLogCollector {
  private readonly consoleLogs: ConsoleLog[] = [];
  private readonly requestsMap: Map<Request, NetworkLog> = new Map();

  private webviewPage: Page | null = null;

  private readonly onConsole = (msg: ConsoleMessage) => {
    this.consoleLogs.push({
      timestamp: new Date().toISOString(),
      level: msg.type(),
      text: msg.text(),
    });
  };

  private readonly onRequest = (request: Request) => {
    this.requestsMap.set(request, {
      timestamp: new Date().toISOString(),
      method: request.method(),
      url: request.url(),
      pending: true,
    });
  };

  private readonly onResponse = async (response: Response) => {
    const request = response.request();
    const logEntry = this.requestsMap.get(request);

    if (logEntry) {
      logEntry.pending = false;
      logEntry.status = response.status();
      logEntry.duration = Date.now() - new Date(logEntry.timestamp).getTime();

      if (response.status() >= 400) {
        // capture data for 4xx and 5xx for debugging
        logEntry.postData = request.postData() ?? "";
        try {
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
    }
  };

  private attachToWebview(page: Page): void {
    this.webviewPage = page;
    page.on("console", this.onConsole);
    page.on("request", this.onRequest);
    page.on("response", this.onResponse);
    page.on("requestfailed", this.onRequestFailed);
  }

  start(electronApp: ElectronApplication): void {
    electronApp.on("window", (page: Page) => {
      // Exit early if we've already attached to a webview
      if (this.webviewPage) return;

      // In the current implementation, the webview is the second window opened by the app.
      // If this changes in the future, we may need a more robust way to identify the webview.
      const windows = electronApp.windows();
      if (windows.length <= 1) return;

      // Attach to the webview page
      this.attachToWebview(page);
    });
  }

  getFormattedConsoleLogs(): string {
    if (this.consoleLogs.length === 0) return "";

    return this.consoleLogs
      .map(entry => `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.text}`)
      .join("\n");
  }

  getFormattedNetworkLogs(): string {
    if (this.requestsMap.size === 0) return "";

    const logEntriesArray = Array.from(this.requestsMap.values());
    return JSON.stringify(logEntriesArray, null, 2);
  }
}
