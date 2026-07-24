import { appendFileSync, mkdirSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { join, isAbsolute, relative } from "node:path";
import type { TestRecord } from "../schema.ts";

/**
 * Detox append-only Jest reporter — PRD §7.
 *
 * Detox's native `--retries` reruns spec files in *fresh jest processes*, so
 * jest's own per-test retry fields can't span a transition. This reporter runs
 * in every attempt's process and APPENDS one normalized record per
 * `onTestResult`. The flake reducer later correlates the appended records
 * (fail-before-pass per `(file,title)` = flake).
 *
 * Two hard requirements:
 *  1. APPEND per `onTestResult` — the run uses `--forceExit`, so buffering to
 *     `onRunComplete` would lose data.
 *  2. Per-WORKER files (parallel `JEST_MAX_WORKERS`) written as NDJSON, one
 *     record per line, then merged at the end — avoids torn appends when a
 *     `stack` exceeds the atomic-write size (each line is flushed independently
 *     and the merge step tolerates a trailing partial line).
 */

/** Resolved lazily so tests (and reruns) can override via env per-invocation. */
function outputDir(): string {
  return process.env.QUARANTINE_FLAKE_DIR ?? join(process.cwd(), "artifacts", "quarantine-flake");
}

function attemptIndex(): number {
  // Detox exposes the current attempt via env on reruns; default to 0.
  const raw = process.env.DETOX_RETRY_INDEX ?? process.env.QUARANTINE_ATTEMPT;
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function workerFile(): string {
  const worker = process.env.JEST_WORKER_ID ?? "1";
  const attempt = attemptIndex();
  return join(outputDir(), `worker-${worker}-attempt-${attempt}.ndjson`);
}

function toRepoRelative(file: string): string {
  const root = process.env.QUARANTINE_REPO_ROOT ?? process.cwd();
  const rel = isAbsolute(file) ? relative(root, file) : file;
  return rel.split("\\").join("/");
}

interface JestAssertion {
  fullName?: string;
  title?: string;
  status: string;
  failureMessages?: string[];
}

interface JestAggregatedTestResult {
  testFilePath?: string;
  testResults?: JestAssertion[];
}

/** The jest reporter contract subset we implement. */
export default class DetoxFlakeReporter {
  onTestResult(_test: unknown, testResult: JestAggregatedTestResult): void {
    try {
      mkdirSync(outputDir(), { recursive: true });
    } catch {
      /* directory may already exist */
    }
    const file = toRepoRelative(testResult.testFilePath ?? "unknown");
    const attempt = attemptIndex();

    for (const assertion of testResult.testResults ?? []) {
      const title = assertion.fullName || assertion.title || "";
      let status: TestRecord["status"];
      if (assertion.status === "passed") status = "passed";
      else if (assertion.status === "failed") status = "failed";
      else status = "skipped";

      const message = assertion.failureMessages?.[0];
      const record: TestRecord = {
        file,
        title,
        attempt,
        recordedAt: Date.now(),
        status,
        ...(status === "failed"
          ? { unexpected: true, errorMessage: message?.split("\n")[0], stack: message }
          : {}),
      };
      // One NDJSON line per record; append-only so it survives --forceExit.
      try {
        appendFileSync(workerFile(), `${JSON.stringify(record)}\n`, "utf8");
      } catch {
        /* best-effort: never break the test run */
      }
    }
  }
}

/**
 * Merge all per-worker NDJSON files in `dir` into a single record list.
 *
 * Tolerates a trailing torn line (a record whose write was cut off): such a
 * line fails JSON.parse and is skipped. Complete records are always intact
 * because each is written by a single `appendFileSync` of one line.
 */
export function mergeFlakeRecords(dir: string = outputDir()): TestRecord[] {
  if (!existsSync(dir)) return [];
  const records: TestRecord[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".ndjson")) continue;
    const content = readFileSync(join(dir, name), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        records.push(JSON.parse(trimmed) as TestRecord);
      } catch {
        // torn / partial line — skip
      }
    }
  }
  return records;
}

/**
 * Collapse per-attempt Detox records into ONE final outcome per (file, title),
 * for the ignore exit-gate.
 *
 * Detox reruns a failed spec in a FRESH jest process per attempt, so the last
 * jest `--outputFile` isn't a reliable "did it ultimately fail?" signal — the
 * merged NDJSON is. A test PASSES if ANY attempt passed (a retry succeeded) and
 * FAILS only if every attempt failed. This is independent of the attempt index
 * (which Detox doesn't always surface to the reporter).
 */
export function collapseAttemptsToFinal(records: TestRecord[]): TestRecord[] {
  const byKey = new Map<
    string,
    { file: string; title: string; passed: boolean; failure?: TestRecord }
  >();
  for (const r of records) {
    const key = JSON.stringify([r.file, r.title]);
    const cur = byKey.get(key) ?? { file: r.file, title: r.title, passed: false };
    if (r.status === "passed") cur.passed = true;
    else if (r.status === "failed" && !cur.failure) cur.failure = r;
    byKey.set(key, cur);
  }

  const out: TestRecord[] = [];
  for (const v of byKey.values()) {
    if (v.passed) {
      out.push({ file: v.file, title: v.title, attempt: 0, status: "passed" });
    } else if (v.failure) {
      out.push({ ...v.failure, attempt: 0, status: "failed", unexpected: true });
    }
  }
  return out;
}
