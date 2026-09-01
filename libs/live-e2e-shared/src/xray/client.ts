/**
 * Minimal Xray Cloud REST v2 client: authenticate, then import a Test Execution.
 *
 * Dependency-free on purpose — it is imported both by the desktop Playwright reporter and, with
 * types stripped by plain `node`, by the mobile publish script. Keep it free of imports other
 * than `import type`, and free of syntax Node's type stripping rejects (enum, namespace,
 * parameter properties, decorators).
 */
import type { XrayReport } from "./report.ts";

const DEFAULT_BASE_URL = "https://xray.cloud.getxray.app";
const DEFAULT_TIMEOUT_MS = 30_000;

export type XrayCredentials = {
  clientId: string;
  clientSecret: string;
  /** Root URL, with or without a trailing `/api/v2`. */
  baseUrl?: string;
  timeoutMs?: number;
};

/** True when publishing is switched on and both credentials are present. */
export function isXrayPublishEnabled(env: Record<string, string | undefined>): boolean {
  return env.XRAY_ENABLED === "true" && !!env.XRAY_CLIENT_ID && !!env.XRAY_CLIENT_SECRET;
}

/** Accepts the Xray root or a URL that already ends in `/api/v2`, so callers cannot double it up. */
function normalizeBaseUrl(value: string): string {
  return value
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/v2$/i, "")
    .replace(/\/+$/, "");
}

async function readBody(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "<unreadable body>";
  }
}

/**
 * Xray rejects the ENTIRE import when any `testKey` is not a Test issue — a key pointing at a Bug,
 * a typo or a deleted ticket. Pull the offending key out of the error so one bad tag cannot cost
 * us every result in the run.
 */
function unknownTestKey(message: string): string | undefined {
  return message.match(/(?:Test|Issue) with key\s+([A-Z][A-Z0-9]*-\d+)/i)?.[1];
}

export class XrayClient {
  private readonly baseUrl: string;
  private readonly credentials: XrayCredentials;
  private token: string | undefined;

  constructor(credentials: XrayCredentials) {
    this.credentials = credentials;
    this.baseUrl = normalizeBaseUrl(credentials.baseUrl?.trim() || DEFAULT_BASE_URL);
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.credentials.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }
  }

  async authenticate(): Promise<string> {
    if (this.token) return this.token;

    const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v2/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
      }),
    });
    if (!response.ok) {
      throw new Error(
        `Xray authentication failed: ${response.status} ${response.statusText} — ${await readBody(response)}`,
      );
    }
    // The endpoint returns the JWT as a JSON string, i.e. wrapped in quotes.
    const token = (await response.json()) as string;
    if (typeof token !== "string" || token.length === 0) {
      throw new Error("Xray authentication returned an empty token");
    }
    this.token = token;
    return token;
  }

  private async importOnce(report: XrayReport): Promise<string> {
    const token = await this.authenticate();
    const response = await this.fetchWithTimeout(`${this.baseUrl}/api/v2/import/execution`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(report),
    });
    if (!response.ok) {
      throw new Error(
        `Xray import failed: ${response.status} ${response.statusText} — ${await readBody(response)}`,
      );
    }
    const body = (await response.json()) as { key?: string };
    if (!body.key) {
      throw new Error(`Xray import returned no execution key: ${JSON.stringify(body)}`);
    }
    return body.key;
  }

  /**
   * Imports the report, dropping any test key Xray reports as invalid and retrying, so a single
   * mis-tagged test cannot sink the whole execution.
   *
   * @returns the created or updated Test Execution key.
   */
  async importExecution(report: XrayReport): Promise<string> {
    let tests = report.tests;
    const skipped: string[] = [];

    for (let attempt = 0; attempt <= Math.min(report.tests.length, 50); attempt++) {
      try {
        return await this.importOnce({ ...report, tests });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const badKey = unknownTestKey(message);
        const remaining = badKey ? tests.filter(test => test.testKey !== badKey) : tests;
        if (!badKey || remaining.length === tests.length || remaining.length === 0) throw error;
        skipped.push(badKey);
        tests = remaining;
        console.warn(`[xray] dropping key Xray does not recognise as a Test: ${badKey}`);
      }
    }
    throw new Error(`Xray import gave up after dropping: ${skipped.join(", ")}`);
  }
}
