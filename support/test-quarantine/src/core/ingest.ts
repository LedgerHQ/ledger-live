import { ciRunUrl, isCI } from "./ci.ts";
import type { Flake } from "./detect.ts";
import { redactErrorMessage, stripStackFrames } from "./redact.ts";

/** One flake as accepted by the wallet-flake-reporting ingest API. */
export interface IngestEvent {
  testTitle: string;
  file: string;
  /**
   * Human-readable failure text with the stack trace removed and secrets
   * redacted. Stacks are never sent: they are the most likely place for a secret
   * to leak, and they are mostly runner internals. See `redact.ts`.
   */
  errorMessage: string;
  retryCount?: number;
  ciRunUrl?: string;
  codeowner?: string;
  /** ISO 8601. */
  occurredAt: string;
}

const MAX_TITLE_LENGTH = 1000;
const MAX_FILE_LENGTH = 1000;
const MAX_ERROR_LENGTH = 20000;
const MAX_RETRY_COUNT = 100;

const MAX_EVENTS_PER_REQUEST = 500;
const MAX_BODY_BYTES = 1024 * 1024;

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_ATTEMPTS_PER_BATCH = 5;

/**
 * Bounds on how long a 429 may park the job.
 *
 * Reporting is best-effort and runs at the very end of a test job, so honouring
 * an unbounded `Retry-After` would let a misconfigured server hold a CI runner
 * for hours. One second is the fallback when the header is missing or unusable.
 */
const DEFAULT_RETRY_AFTER_SECONDS = 1;
const MAX_RETRY_AFTER_SECONDS = 30;

/**
 * Total time all batches together may spend waiting on rate limits.
 *
 * Per-batch bounds are not enough: a run with many batches could still park a
 * runner for a long time by waiting the maximum on each one. Once this budget is
 * spent, remaining batches are dropped rather than delaying the job further.
 */
const MAX_TOTAL_BACKOFF_MS = 60_000;

export interface IngestOptions {
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
  /** Overrides `FLAKE_API_HOST`; used by tests and the stub server. */
  host?: string;
  warn?: (message: string) => void;
  sleep?: (ms: number) => Promise<void>;
  now?: Date;
}

export interface IngestSummary {
  attempted: number;
  delivered: number;
  /** True when nothing was sent because reporting was not configured or not in CI. */
  skipped: boolean;
  reason?: string;
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

/** Shape, redact and clamp flakes into the ingest contract. */
export function toIngestEvents(flakes: Flake[], options: IngestOptions = {}): IngestEvent[] {
  const env = options.env ?? process.env;
  const occurredAt = (options.now ?? new Date()).toISOString();
  const runUrl = ciRunUrl(env);

  return flakes.map(flake => ({
    testTitle: truncate(flake.title, MAX_TITLE_LENGTH),
    file: truncate(flake.file, MAX_FILE_LENGTH),
    errorMessage: truncate(
      redactErrorMessage(stripStackFrames(flake.errorMessage)),
      MAX_ERROR_LENGTH,
    ),
    retryCount: Math.min(Math.max(flake.retryCount, 0), MAX_RETRY_COUNT),
    ciRunUrl: runUrl,
    occurredAt,
  }));
}

/** Split events so no request exceeds the server's count or body-size limits. */
export function batchEvents(events: IngestEvent[]): IngestEvent[][] {
  const bodyBytes = (batch: IngestEvent[]): number =>
    Buffer.byteLength(JSON.stringify({ events: batch }), "utf8");

  const batches: IngestEvent[][] = [];
  let current: IngestEvent[] = [];

  for (const event of events) {
    const candidate = [...current, event];
    const tooMany = candidate.length > MAX_EVENTS_PER_REQUEST;
    const tooBig = bodyBytes(candidate) > MAX_BODY_BYTES;
    if (current.length > 0 && (tooMany || tooBig)) {
      batches.push(current);
      current = [event];
    } else {
      current = candidate;
    }
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

/**
 * How long to wait before retrying a 429.
 *
 * Anything absent, non-numeric, negative or absurdly large falls back to a
 * bounded default rather than being trusted.
 */
export function retryAfterSeconds(headerValue: string | null): number {
  // `Number("")` and `Number("   ")` are both 0, which would busy-loop the
  // retries, so blank is treated as absent rather than as a number.
  if (headerValue === null || headerValue.trim() === "") {
    return DEFAULT_RETRY_AFTER_SECONDS;
  }
  const parsed = Number(headerValue);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_RETRY_AFTER_SECONDS;
  return Math.min(parsed, MAX_RETRY_AFTER_SECONDS);
}

/**
 * Build the ingest endpoint from the configured host.
 *
 * The trailing slash matters: it keeps any path prefix in the host (a proxy
 * mounted at `/flake`, say) instead of silently discarding it. Returns
 * `undefined` for a host that is not a URL at all, so a typo in CI config warns
 * rather than throwing out of the reporter.
 */
function ingestUrl(host: string): string | undefined {
  // The one `endsWith` outside redact.ts. It tests for a single character rather
  // than matching a path, so it is not the fuzzy suffix comparison the tool's
  // matching rules rule out.
  const base = host.endsWith("/") ? host : `${host}/`;
  try {
    return new URL("api/ingest", base).toString();
  } catch {
    return undefined;
  }
}

const defaultSleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Send flakes to the ingest API.
 *
 * Reporting must never fail or stall a test job, so every failure path here
 * warns and continues, and the only blocking wait (a 429 backoff) is bounded.
 */
export async function reportFlakes(
  flakes: Flake[],
  options: IngestOptions = {},
): Promise<IngestSummary> {
  const env = options.env ?? process.env;
  const warn = options.warn ?? ((message: string) => console.warn(message));
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;

  if (!isCI(env)) {
    return { attempted: flakes.length, delivered: 0, skipped: true, reason: "not CI" };
  }

  const apiKey = env.FLAKE_API_KEY;
  const host = options.host ?? env.FLAKE_API_HOST;
  if (!apiKey || !host) {
    warn("[test-quarantine] FLAKE_API_KEY or FLAKE_API_HOST unset — flake reporting is a no-op.");
    return { attempted: flakes.length, delivered: 0, skipped: true, reason: "not configured" };
  }
  if (flakes.length === 0) {
    return { attempted: 0, delivered: 0, skipped: false };
  }

  const url = ingestUrl(host);
  if (url === undefined) {
    warn(`[test-quarantine] FLAKE_API_HOST is not a valid URL (${host}) — not reporting.`);
    return { attempted: flakes.length, delivered: 0, skipped: true, reason: "bad host" };
  }

  const batches = batchEvents(toIngestEvents(flakes, options));
  const budget = { remainingBackoffMs: MAX_TOTAL_BACKOFF_MS };
  let delivered = 0;

  for (const batch of batches) {
    delivered += await deliverBatch(batch, { url, apiKey, fetchImpl, sleep, warn, budget });
  }

  return { attempted: flakes.length, delivered, skipped: false };
}

interface DeliveryContext {
  url: string;
  apiKey: string;
  fetchImpl: typeof fetch;
  sleep: (ms: number) => Promise<void>;
  warn: (message: string) => void;
  /** Shared across every batch in the run, so total waiting stays bounded. */
  budget: { remainingBackoffMs: number };
}

/** Post one batch, retrying only while the server asks us to. Returns how many landed. */
async function deliverBatch(batch: IngestEvent[], ctx: DeliveryContext): Promise<number> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_BATCH; attempt += 1) {
    let response: Response;
    try {
      response = await ctx.fetchImpl(ctx.url, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": ctx.apiKey },
        body: JSON.stringify({ events: batch }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      ctx.warn(`[test-quarantine] flake ingest error: ${(error as Error).message} — continuing.`);
      return 0;
    }

    if (response.status === 429) {
      const waitMs = retryAfterSeconds(response.headers.get("retry-after")) * 1000;
      if (waitMs > ctx.budget.remainingBackoffMs) {
        ctx.warn("[test-quarantine] flake ingest backoff budget spent — dropping this batch.");
        return 0;
      }
      ctx.budget.remainingBackoffMs -= waitMs;
      ctx.warn(`[test-quarantine] flake ingest rate-limited — retrying in ${waitMs / 1000}s.`);
      await ctx.sleep(waitMs);
      continue;
    }
    if (!response.ok) {
      ctx.warn(`[test-quarantine] flake ingest failed (${response.status}) — continuing.`);
      return 0;
    }
    return batch.length;
  }

  ctx.warn("[test-quarantine] flake ingest still rate-limited — giving up on this batch.");
  return 0;
}
