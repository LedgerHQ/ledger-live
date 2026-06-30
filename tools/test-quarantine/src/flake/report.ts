import type { FlakeEvent } from "./reduce.ts";
import type { LoadedEntry } from "../schema.ts";
import { matchEntry } from "../match.ts";

/** Ingest event shape — PRD §7 contract (wallet-flake-reporting). */
export interface IngestEvent {
  testTitle: string; // <=1000
  file: string; // <=1000
  errorMessage: string; // <=20000
  stack?: string; // <=50000
  retryCount?: number; // 0..100
  ciRunUrl?: string;
  codeowner?: string;
  occurredAt: string; // ISO 8601
}

const MAX_EVENTS_PER_REQUEST = 500;
const MAX_BODY_BYTES = 1024 * 1024; // 1 MiB
const DEFAULT_HOST = process.env.FLAKE_API_HOST ?? "https://flake.invalid"; // §13: real host TBD

// ---------------------------------------------------------------------------
// Redaction — PROVISIONAL policy, pending §13 security sign-off.
//
// A wallet repo's E2E stacks can leak mock mnemonics / addresses / RPC URLs.
// Until the redaction policy is signed off (PRD §10, §13), we ship a
// conservative default:
//   * `stack` is OMITTED entirely.
//   * `errorMessage` is denylist-redacted for obvious secret-like tokens.
// This is deliberately over-cautious; relax once the policy lands.
// ---------------------------------------------------------------------------
const REDACTION_RULES: { name: string; pattern: RegExp }[] = [
  // 12/24-word BIP39-looking mnemonic runs (>=12 lowercase words in a row)
  { name: "mnemonic", pattern: /\b(?:[a-z]{3,8}\s+){11,23}[a-z]{3,8}\b/g },
  // hex addresses / private-key-like blobs
  { name: "hex", pattern: /\b0x[a-fA-F0-9]{16,}\b/g },
  // bech32-ish addresses
  { name: "bech32", pattern: /\b(?:bc1|tb1|cosmos1|ltc1)[a-z0-9]{20,}\b/g },
  // URLs with credentials or query strings that may carry keys
  { name: "url", pattern: /\bhttps?:\/\/[^\s"']+/g },
];

export function redactErrorMessage(message: string | undefined): string {
  if (!message) return "";
  let out = message;
  for (const rule of REDACTION_RULES) {
    out = out.replace(rule.pattern, `[redacted:${rule.name}]`);
  }
  return out;
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

function ciRunUrl(env: NodeJS.ProcessEnv): string | undefined {
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID } = env;
  if (GITHUB_SERVER_URL && GITHUB_REPOSITORY && GITHUB_RUN_ID) {
    return `${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}`;
  }
  return undefined;
}

/** Convert reduced flakes into contract-shaped, redacted ingest events. */
export function toIngestEvents(
  flakes: FlakeEvent[],
  entries: LoadedEntry[],
  env: NodeJS.ProcessEnv = process.env,
  now: Date = new Date(),
): IngestEvent[] {
  const runUrl = ciRunUrl(env);
  return flakes.map(flake => {
    const owner = matchEntry(entries, flake.file, flake.title)?.entry.owner;
    return {
      testTitle: truncate(flake.title, 1000),
      file: truncate(flake.file, 1000),
      // PROVISIONAL redaction; stack omitted entirely (see above).
      errorMessage: truncate(redactErrorMessage(flake.errorMessage), 20000),
      retryCount: Math.min(Math.max(flake.retryCount, 0), 100),
      ciRunUrl: runUrl,
      codeowner: owner,
      occurredAt: now.toISOString(),
    };
  });
}

/** Split events into batches of <=500 and <=1 MiB body. */
export function batchEvents(events: IngestEvent[]): IngestEvent[][] {
  const batches: IngestEvent[][] = [];
  let current: IngestEvent[] = [];

  const bodyBytes = (evts: IngestEvent[]) =>
    Buffer.byteLength(JSON.stringify({ events: evts }), "utf8");

  for (const event of events) {
    const tentative = [...current, event];
    if (
      current.length > 0 &&
      (tentative.length > MAX_EVENTS_PER_REQUEST || bodyBytes(tentative) > MAX_BODY_BYTES)
    ) {
      batches.push(current);
      current = [event];
    } else {
      current = tentative;
    }
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

export interface ReportOptions {
  env?: NodeJS.ProcessEnv;
  fetchImpl?: typeof fetch;
  /** Override the ingest host (used by tests / the mock server). */
  host?: string;
  warn?: (message: string) => void;
  /** Sleep impl, injectable for tests; defaults to setTimeout. */
  sleep?: (ms: number) => Promise<void>;
  now?: Date;
}

export interface ReportSummary {
  attempted: number;
  delivered: number;
  skipped: boolean;
  reason?: string;
}

const defaultSleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/**
 * Emit flake events to the wallet-flake-reporting ingest API — PRD §7.
 *
 * Behaviour (all required):
 * - NO-OP with a single warning when `FLAKE_API_KEY` is unset.
 * - CI-only: no-op when `process.env.CI` is falsy.
 * - On 429, honour `Retry-After` and retry the same batch.
 * - On any other error, LOG and CONTINUE — reporting must never fail the job.
 */
export async function reportFlakes(
  flakes: FlakeEvent[],
  entries: LoadedEntry[],
  options: ReportOptions = {},
): Promise<ReportSummary> {
  const env = options.env ?? process.env;
  const warn = options.warn ?? (msg => console.warn(msg));
  const fetchImpl = options.fetchImpl ?? fetch;
  const host = options.host ?? env.FLAKE_API_HOST ?? DEFAULT_HOST;
  const sleep = options.sleep ?? defaultSleep;

  if (!env.CI) {
    return { attempted: flakes.length, delivered: 0, skipped: true, reason: "not CI" };
  }
  const apiKey = env.FLAKE_API_KEY;
  if (!apiKey) {
    warn("[test-quarantine] FLAKE_API_KEY unset — flake reporting is a no-op.");
    return { attempted: flakes.length, delivered: 0, skipped: true, reason: "no api key" };
  }
  if (flakes.length === 0) {
    return { attempted: 0, delivered: 0, skipped: false };
  }

  const events = toIngestEvents(flakes, entries, env, options.now);
  const batches = batchEvents(events);
  const url = `${host.replace(/\/$/, "")}/api/ingest`;
  let delivered = 0;

  for (const batch of batches) {
    let attemptsLeft = 5;
    // eslint-disable-next-line no-await-in-loop
    while (attemptsLeft > 0) {
      attemptsLeft -= 1;
      try {
        // eslint-disable-next-line no-await-in-loop
        const res = await fetchImpl(url, {
          method: "POST",
          headers: { "content-type": "application/json", "x-api-key": apiKey },
          body: JSON.stringify({ events: batch }),
          signal: AbortSignal.timeout(15000),
        });
        if (res.status === 429) {
          const headerValue = res.headers.get("retry-after");
          const parsed = headerValue === null ? NaN : Number(headerValue);
          const retryAfter = Number.isFinite(parsed) ? parsed : 1;
          warn(`[test-quarantine] flake ingest 429 — retrying after ${retryAfter}s`);
          // eslint-disable-next-line no-await-in-loop
          await sleep(retryAfter * 1000);
          continue;
        }
        if (res.ok) {
          delivered += batch.length;
        } else {
          warn(`[test-quarantine] flake ingest failed (${res.status}) — continuing.`);
        }
        break;
      } catch (error) {
        warn(`[test-quarantine] flake ingest error: ${(error as Error).message} — continuing.`);
        break;
      }
    }
  }

  return { attempted: flakes.length, delivered, skipped: false };
}
