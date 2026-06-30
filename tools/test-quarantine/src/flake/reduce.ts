import type { TestRecord } from "../schema.ts";

/** A detected flake: a test that failed an attempt and passed a later one. */
export interface FlakeEvent {
  file: string;
  title: string;
  /** The failing attempt's error message (from the last failed attempt). */
  errorMessage?: string;
  /** The failing attempt's stack (from the last failed attempt). */
  stack?: string;
  /** Attempt index that finally passed. */
  retryCount: number;
}

/**
 * Source-agnostic flake reducer — PRD §7.
 *
 * Groups normalized records by `(file, title)`, orders by attempt, and flags a
 * flake on any fail->pass transition. Treats inline attempts (Jest/Playwright)
 * and attempts appended across processes (Detox reporter) identically.
 *
 * A group is a flake iff it contains at least one `failed` attempt AND a later
 * `passed` attempt (by attempt index). The error info attached is from the
 * latest failed attempt before the pass.
 */
export function reduceFlakes(records: TestRecord[]): FlakeEvent[] {
  const groups = new Map<string, TestRecord[]>();
  for (const record of records) {
    const key = JSON.stringify([record.file, record.title]);
    const list = groups.get(key);
    if (list) list.push(record);
    else groups.set(key, [record]);
  }

  const flakes: FlakeEvent[] = [];

  for (const list of groups.values()) {
    const ordered = [...list].sort((a, b) => a.attempt - b.attempt);

    let lastFailed: TestRecord | undefined;
    let flakedPassAttempt: number | undefined;

    for (const record of ordered) {
      if (record.status === "failed") {
        lastFailed = record;
      } else if (record.status === "passed" && lastFailed) {
        // fail seen earlier, now passing -> flake
        flakedPassAttempt = record.attempt;
        break;
      }
    }

    if (lastFailed && flakedPassAttempt !== undefined) {
      flakes.push({
        file: lastFailed.file,
        title: lastFailed.title,
        errorMessage: lastFailed.errorMessage,
        stack: lastFailed.stack,
        retryCount: flakedPassAttempt,
      });
    }
  }

  return flakes;
}
