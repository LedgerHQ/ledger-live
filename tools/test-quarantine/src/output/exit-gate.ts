import type { LoadedEntry, TestRecord } from "../schema.ts";
import { matchEntry } from "../match.ts";

export interface ExitGateInput {
  /** The runner's own exit code. */
  runnerExitCode: number;
  /** Normalized records parsed from the runner's machine-readable output. */
  records: TestRecord[];
  /** Active (non-expired) quarantine entries. */
  entries: LoadedEntry[];
}

export interface ExitGateResult {
  /** The exit code the wrapper should exit with. */
  exitCode: number;
  /** Whether the gate overrode a non-zero runner exit to 0. */
  overridden: boolean;
  /** Titles whose unexpected failures were absorbed by an `ignore` entry. */
  ignored: { file: string; title: string }[];
  /** Unexpected failures that did NOT map to an `ignore` entry (block merge). */
  unhandled: { file: string; title: string }[];
}

/**
 * `ignore` exit-gate — PRD §6.2.
 *
 * The test runs normally; afterwards we inspect FINAL outcomes. If EVERY
 * unexpected failure maps to a quarantined `ignore` entry, we force exit 0;
 * otherwise we propagate the runner's exit code.
 *
 * Key safety properties:
 * - Failure-type-agnostic: works off the parsed `failed` status, so timeouts,
 *   unhandled rejections, snapshot mismatches and afterEach failures are all
 *   covered identically.
 * - Never masks an unquarantined failure: if a single unexpected failure has no
 *   matching `ignore` entry, the gate refuses to override.
 * - Only considers the FINAL attempt per (file,title): a test that failed an
 *   attempt but ultimately passed is not a failure and never needs ignoring.
 */
export function applyExitGate(input: ExitGateInput): ExitGateResult {
  const { runnerExitCode, records, entries } = input;
  const ignoreEntries = entries.filter(e => e.entry.mode === "ignore");

  // Reduce to the final outcome per (file,title): a test is a "failure" only
  // if its highest-attempt record is a failed/unexpected one.
  const finalByKey = new Map<string, TestRecord>();
  for (const record of records) {
    const key = JSON.stringify([record.file, record.title]);
    const existing = finalByKey.get(key);
    if (!existing || record.attempt >= existing.attempt) {
      finalByKey.set(key, record);
    }
  }

  const ignored: { file: string; title: string }[] = [];
  const unhandled: { file: string; title: string }[] = [];

  for (const record of finalByKey.values()) {
    if (record.status !== "failed") continue;
    // Only *unexpected* failures count. (Playwright marks expected failures.)
    if (record.unexpected === false) continue;

    const match = matchEntry(ignoreEntries, record.file, record.title);
    if (match) {
      ignored.push({ file: record.file, title: record.title });
    } else {
      unhandled.push({ file: record.file, title: record.title });
    }
  }

  // Override to success only when the run failed, there is at least one
  // ignored failure, and NO unhandled (unquarantined) failure remains.
  const shouldOverride = runnerExitCode !== 0 && unhandled.length === 0 && ignored.length > 0;

  return {
    exitCode: shouldOverride ? 0 : runnerExitCode,
    overridden: shouldOverride,
    ignored,
    unhandled,
  };
}
