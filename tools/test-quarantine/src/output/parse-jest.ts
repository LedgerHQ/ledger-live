import { relative, isAbsolute } from "node:path";
import type { TestRecord } from "../schema.ts";

/**
 * Parse Jest `--json` output into normalized {@link TestRecord}s.
 *
 * Jest encodes a fail->pass transition inline: a passed `assertionResult` that
 * carries a non-empty `retryReasons[]` means earlier attempts failed (PRD §7).
 * We expand that into one `failed` record per retryReason (attempts 0..n-1)
 * plus one `passed` record (attempt n), so the shared reducer sees the
 * transition. With no retries configured, `retryReasons` is empty -> a single
 * record, no flake.
 */
export interface JestAssertionResult {
  title: string;
  fullName: string;
  status: "passed" | "failed" | "pending" | "skipped" | "todo" | "disabled" | "focused";
  failureMessages?: string[];
  retryReasons?: string[];
}

export interface JestTestResult {
  name: string; // absolute file path
  assertionResults: JestAssertionResult[];
}

export interface JestJson {
  testResults: JestTestResult[];
}

function toRepoRelative(repoRoot: string, file: string): string {
  const rel = isAbsolute(file) ? relative(repoRoot, file) : file;
  return rel.split("\\").join("/");
}

function firstLine(message: string | undefined): string | undefined {
  if (!message) return undefined;
  return message.split("\n")[0];
}

export function parseJest(json: JestJson, repoRoot: string): TestRecord[] {
  const records: TestRecord[] = [];

  for (const suite of json.testResults ?? []) {
    const file = toRepoRelative(repoRoot, suite.name);
    for (const assertion of suite.assertionResults ?? []) {
      const title = assertion.fullName || assertion.title;
      const retryReasons = assertion.retryReasons ?? [];

      if (assertion.status === "passed" && retryReasons.length > 0) {
        // Failed attempts encoded as retryReasons, then the passing attempt.
        retryReasons.forEach((reason, attempt) => {
          records.push({
            file,
            title,
            attempt,
            status: "failed",
            unexpected: true,
            errorMessage: firstLine(reason),
            stack: reason,
          });
        });
        records.push({ file, title, attempt: retryReasons.length, status: "passed" });
        continue;
      }

      if (assertion.status === "failed") {
        const message = assertion.failureMessages?.[0];
        records.push({
          file,
          title,
          attempt: 0,
          status: "failed",
          unexpected: true,
          errorMessage: firstLine(message),
          stack: message,
        });
        continue;
      }

      if (assertion.status === "passed") {
        records.push({ file, title, attempt: 0, status: "passed" });
        continue;
      }

      // pending / skipped / todo / disabled
      records.push({ file, title, attempt: 0, status: "skipped" });
    }
  }

  return records;
}

export function parseJestString(raw: string, repoRoot: string): TestRecord[] {
  return parseJest(JSON.parse(raw) as JestJson, repoRoot);
}
