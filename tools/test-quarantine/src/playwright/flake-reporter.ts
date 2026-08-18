import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import { detectFlakes } from "../core/detect.ts";
import { reportFlakes, type IngestOptions } from "../core/ingest.ts";
import type { TestOutcome, TestStatus } from "../core/outcome.ts";
import { repoRoot, toRepoRelative } from "../core/paths.ts";

/**
 * Translate Playwright's status vocabulary into ours.
 *
 * A timeout is a failure that happens to have run out of clock; `interrupted`
 * means the run was cut short before this attempt finished, so it says nothing
 * about the test and is treated as not-run.
 */
function toTestStatus(status: TestResult["status"]): TestStatus {
  if (status === "passed") return "passed";
  if (status === "failed" || status === "timedOut") return "failed";
  return "skipped";
}

/**
 * The describe titles plus the test title, space-joined.
 *
 * Deliberately NOT `titlePath()`: that also includes the root, the project name
 * and the file path, so the reported title would change when a project is
 * renamed and would duplicate the `file` field. Walking the suite chain and
 * keeping only `describe` suites gives the same shape as jest's `fullName`, so a
 * title means the same thing whichever runner produced it.
 */
export function fullTitle(test: TestCase): string {
  const titles: string[] = [];
  for (let suite: Suite | undefined = test.parent; suite; suite = suite.parent) {
    if (suite.type === "describe") titles.unshift(suite.title);
  }
  titles.push(test.title);
  return titles.join(" ");
}

function errorMessage(result: TestResult): string | undefined {
  const messages = result.errors.map(error => error.message).filter(Boolean);
  return messages.length > 0 ? messages.join("\n") : undefined;
}

/**
 * One outcome per attempt Playwright recorded for this test.
 *
 * `result.retry` is already the 0-based attempt index we want, so unlike jest
 * there is nothing to convert.
 */
export function toOutcomes(test: TestCase, root: string): TestOutcome[] {
  // A test declared with `test.fail()` is expected to fail; its failures are the
  // point, not a flake.
  if (test.expectedStatus !== "passed") return [];

  const file = toRepoRelative(test.location.file, root);
  const title = fullTitle(test);
  // Each project runs the spec independently and can flake on its own, so the
  // project name keeps their attempts in separate groups.
  const variant = test.parent.project()?.name;

  return test.results.map(result => {
    const status = toTestStatus(result.status);
    return {
      file,
      title,
      attempt: result.retry,
      status,
      errorMessage: status === "failed" ? errorMessage(result) : undefined,
      variant,
    };
  });
}

/**
 * Reports Playwright tests that only passed after a retry.
 *
 * Playwright hands reporters the whole suite once the run is over, so unlike the
 * jest adapter this one does its work in a single pass at the end. It reads only
 * what the runner reports and changes nothing about the run.
 *
 * It is inert unless the project configures `retries`: with no retries there is
 * never a second attempt, so a flake cannot be distinguished from a failure.
 *
 * Delivery is best-effort — see `reportFlakes`. Nothing here can fail a run.
 */
export default class PlaywrightFlakeReporter implements Reporter {
  readonly #repoRoot: string;
  readonly #options: IngestOptions;
  #suite: Suite | undefined;

  /**
   * Playwright merges its own `{ configDir, _mode, _commandHash }` into whatever
   * the config supplies, so the argument is wider than this — only `host` is
   * meaningfully settable from a config file. The rest of `IngestOptions` exists
   * for tests.
   */
  constructor(options: IngestOptions = {}) {
    this.#options = options;
    this.#repoRoot = repoRoot(options.env);
  }

  onBegin(_config: FullConfig, suite: Suite): void {
    this.#suite = suite;
  }

  /** Playwright waits on the returned promise, so reporting completes before exit. */
  async onEnd(_result: FullResult): Promise<void> {
    // Nothing here is worth failing an otherwise healthy run over.
    try {
      const tests = this.#suite?.allTests() ?? [];
      const outcomes = tests.flatMap(test => toOutcomes(test, this.#repoRoot));
      const flakes = detectFlakes(outcomes);
      if (flakes.length === 0) return;

      // Playwright's own output marks flaky tests, but name them here too so the
      // reported set is visible next to the delivery result.
      console.log(`[test-quarantine] ${flakes.length} test(s) passed only after a retry:`);
      for (const flake of flakes) {
        console.log(`  - ${flake.file} > ${flake.title} (passed on retry ${flake.retryCount})`);
      }

      const summary = await reportFlakes(flakes, this.#options);
      if (summary.skipped) return;
      console.log(
        `[test-quarantine] reported ${summary.delivered}/${flakes.length} to the ingest API.`,
      );
    } catch (error) {
      console.warn(
        `[test-quarantine] flake reporting failed: ${(error as Error).message} — continuing.`,
      );
    }
  }
}
