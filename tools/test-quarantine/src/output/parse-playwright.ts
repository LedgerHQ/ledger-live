import { isAbsolute, join, relative } from "node:path";
import type { TestRecord } from "../schema.ts";

/**
 * Parse Playwright's built-in JSON reporter output into {@link TestRecord}s.
 *
 * Playwright nests suites recursively; each `spec` has `tests[]`, and each test
 * has `results[]` — one entry per attempt (`retry` index). We emit one record
 * per result so the reducer sees fail->pass across retries (PRD §7).
 *
 * Playwright distinguishes expected/unexpected outcomes via `test.status`
 * ("expected" | "unexpected" | "flaky" | "skipped"); a per-result `failed`
 * status that is part of an overall "flaky"/"expected" test is still a real
 * failed attempt for flake detection, but only "unexpected" tests should gate
 * the exit code — we mark each failed result `unexpected` from the test status.
 */
interface PwResult {
  status: "passed" | "failed" | "timedOut" | "skipped" | "interrupted";
  retry?: number;
  error?: { message?: string; stack?: string };
  errors?: { message?: string; stack?: string }[];
}

interface PwTest {
  title?: string;
  status?: "expected" | "unexpected" | "flaky" | "skipped";
  results?: PwResult[];
}

interface PwSpec {
  title: string;
  file?: string;
  tests?: PwTest[];
}

interface PwSuite {
  title?: string;
  file?: string;
  suites?: PwSuite[];
  specs?: PwSpec[];
}

export interface PlaywrightJson {
  /** Playwright echoes the resolved config; `rootDir` is the absolute testDir. */
  config?: { rootDir?: string };
  suites?: PwSuite[];
}

/**
 * Normalize a Playwright spec path to a repo-relative, forward-slash path
 * (mirrors parse-jest's `toRepoRelative`).
 *
 * Playwright reports `spec.file` relative to `config.rootDir` (the testDir),
 * not the repo root — e.g. `specs/general/terms.spec.ts` for a desktop spec.
 * We join it onto `rootDir` and relativize against `repoRoot` so `filter.file`
 * honors the documented repo-relative contract (PRD §5.2) without a globstar
 * workaround. Absolute `spec.file` values (some PW versions) are relativized directly.
 */
function toRepoRelative(repoRoot: string, rootDir: string, file: string): string {
  if (file === "") return "";
  const abs = isAbsolute(file) ? file : join(rootDir, file);
  return relative(repoRoot, abs).split("\\").join("/");
}

function isFailureStatus(status: PwResult["status"]): boolean {
  return status === "failed" || status === "timedOut" || status === "interrupted";
}

export function parsePlaywright(json: PlaywrightJson, repoRoot: string): TestRecord[] {
  const records: TestRecord[] = [];
  const rootDir = json.config?.rootDir ?? repoRoot;

  const walk = (suite: PwSuite, titlePath: string[], fileFromParent: string) => {
    const file = toRepoRelative(repoRoot, rootDir, suite.file || fileFromParent);
    const here = suite.title ? [...titlePath, suite.title] : titlePath;

    for (const spec of suite.specs ?? []) {
      // `spec.file` is rootDir-relative; the inherited `file` is already
      // repo-relative (normalized above), so only re-normalize a spec-level path.
      const specFile = spec.file ? toRepoRelative(repoRoot, rootDir, spec.file) : file;
      for (const test of spec.tests ?? []) {
        const title = [...here, spec.title].filter(Boolean).join(" ");
        const testUnexpected = test.status === "unexpected" || test.status === "flaky";
        for (const result of test.results ?? []) {
          const attempt = result.retry ?? 0;
          if (isFailureStatus(result.status)) {
            const err = result.error ?? result.errors?.[0];
            records.push({
              file: specFile,
              title,
              attempt,
              status: "failed",
              unexpected: testUnexpected || test.status === undefined,
              errorMessage: err?.message,
              stack: err?.stack,
            });
          } else if (result.status === "passed") {
            records.push({ file: specFile, title, attempt, status: "passed" });
          } else {
            records.push({ file: specFile, title, attempt, status: "skipped" });
          }
        }
      }
    }

    for (const child of suite.suites ?? []) {
      walk(child, here, file);
    }
  };

  for (const suite of json.suites ?? []) {
    walk(suite, [], "");
  }

  return records;
}

export function parsePlaywrightString(raw: string, repoRoot: string): TestRecord[] {
  return parsePlaywright(JSON.parse(raw) as PlaywrightJson, repoRoot);
}
