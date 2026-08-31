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

/**
 * URL patterns that are pure noise in E2E network logs: the app's own code/asset
 * bundles, fonts, and third-party telemetry / CDN / countervalues start-up traffic.
 * Dropping these removes the background Swap-panel spam (all asset + Firebase loading)
 * and the app-side CDN / countervalues flood (QAA-1433). The caller keeps failing
 * requests regardless, so a real error is never hidden.
 */
const NETWORK_NOISE_HOSTS = [
  // telemetry / analytics start-up
  "firebaseinstallations.googleapis.com",
  "firebaseremoteconfig.googleapis.com",
  "firebase.googleapis.com",
  "firebaselogging-pa.googleapis.com",
  "sentry.io",
  "segment.io",
  "cdn.segment.com",
  "google-analytics.com",
  "googletagmanager.com",
  "datadoghq.com",
  "braze.com",
  // ledger asset / cdn / countervalues flood
  "cdn.live.ledger.com",
  "countervalues.live.ledger.com",
  "countervalues.api.live.ledger.com",
];

const NETWORK_NOISE_ASSET_PATH = "/_next/static/";

const NETWORK_NOISE_ASSET_EXTENSIONS = new Set([
  // code / styles
  "js",
  "mjs",
  "css",
  "map",
  // fonts
  "woff",
  "woff2",
  "ttf",
  "otf",
  "eot",
  // images / media
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "ico",
  "webp",
  "avif",
  "mp4",
  "wasm",
]);

/** Lowercased file extension of a path, or "" when it has none. */
function pathExtension(pathname: string): string {
  const lastSegment = pathname.slice(pathname.lastIndexOf("/") + 1);
  const dotIndex = lastSegment.lastIndexOf(".");
  return dotIndex === -1 ? "" : lastSegment.slice(dotIndex + 1);
}

/** True when `url` is app-asset / font / telemetry / CDN start-up noise (not a real API call). */
function isNoiseNetworkUrl(url: string): boolean {
  let host = "";
  let pathname = url;
  try {
    const parsed = new URL(url);
    host = parsed.host;
    pathname = parsed.pathname;
  } catch {
    // Non-URL (onRequest only stores http(s), so this is unexpected) — fall back to raw matching,
    // dropping any query/hash so the extension lookup still sees the bare path.
    pathname = url.split(/[?#]/)[0];
  }
  const lowerPath = pathname.toLowerCase();
  if (lowerPath.includes(NETWORK_NOISE_ASSET_PATH)) return true;
  if (NETWORK_NOISE_ASSET_EXTENSIONS.has(pathExtension(lowerPath))) return true;
  return NETWORK_NOISE_HOSTS.some(
    noiseHost => host === noiseHost || host.endsWith(`.${noiseHost}`),
  );
}

export class PageLogCollector {
  private readonly consoleLogs: ConsoleLog[] = [];
  private readonly requestsMap: Map<Request, NetworkLog> = new Map();

  private targetPage: Page | null = null;
  private readonly attachedPages: WeakSet<Page> = new WeakSet<Page>();

  // Console levels worth attaching: warnings + errors only. The full buffer is still kept
  // in `consoleLogs` so getSwapInitError() can match on any level (QAA-1433).
  private static readonly CONSOLE_KEEP_LEVELS = new Set(["warning", "error"]);

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
    const kept = this.consoleLogs.filter(entry =>
      PageLogCollector.CONSOLE_KEEP_LEVELS.has(entry.level),
    );
    if (kept.length === 0) return "";

    return kept
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
      const deviceStep = /"step"\s*:\s*"([^"]+)"/.exec(text)?.[1] ?? "INIT";
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
      .replaceAll("%c", "")
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
    // Always return valid JSON: an empty array serializes to "[]", which keeps the
    // application/json attachment parseable instead of an empty (invalid) body.
    // Drop asset / telemetry / CDN noise (QAA-1433) but always keep failing requests
    // (status >= 400 or a network failure) so a real error is never hidden.
    const logEntriesArray = Array.from(this.requestsMap.values()).filter(entry => {
      const isFailure = (entry.status !== undefined && entry.status >= 400) || !!entry.failureText;
      return isFailure || !isNoiseNetworkUrl(entry.url);
    });
    return JSON.stringify(logEntriesArray, null, 2);
  }
}
