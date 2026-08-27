import type { Reporter, Test, TestContext } from "@jest/reporters";
import type { AggregatedResult, TestCaseResult } from "@jest/test-result";
import { canContributeToFlake, detectFlakes } from "../core/detect.ts";
import { reportFlakes, type IngestOptions } from "../core/ingest.ts";
import type { TestOutcome, TestStatus } from "../core/outcome.ts";
import { repoRoot, toRepoRelative } from "../core/paths.ts";

/**
 * Translate jest's status vocabulary into ours.
 *
 * Only "passed" and "failed" carry meaning for flake detection; every flavour of
 * not-run collapses to "skipped".
 */
function toTestStatus(status: TestCaseResult["status"]): TestStatus {
  if (status === "passed") return "passed";
  if (status === "failed") return "failed";
  return "skipped";
}

/**
 * Turn one `onTestCaseResult` call into one attempt.
 *
 * jest-circus calls the reporter once PER ATTEMPT, not once per test, and
 * `invocations` is that attempt's 1-based index. So a test that fails and then
 * passes arrives as two calls: (failed, invocations 1) then (passed,
 * invocations 2). `invocations` is optional in jest's types and only populated
 * by jest-circus, hence the fallback.
 */
export function toOutcome(result: TestCaseResult, file: string): TestOutcome {
  const status = toTestStatus(result.status);
  return {
    file,
    title: result.fullName,
    attempt: (result.invocations ?? 1) - 1,
    status,
    // Optional access rather than a bare join: `failureMessages` is guaranteed by
    // jest-circus but not by every custom runner, and this is called from an
    // unawaited jest event listener where a throw would fail the run.
    errorMessage: status === "failed" ? (result.failureMessages?.join("\n") ?? "") : undefined,
  };
}

/**
 * Reports tests that jest had to retry before they passed.
 *
 * The reporter observes attempts in-process and never inspects jest's CLI
 * arguments or output files, so it cannot interfere with how a project's tests
 * are selected or reported. It is inert unless the project enables retries via
 * `jest.retryTimes()`: with no retries there is no second attempt to observe.
 *
 * Delivery is best-effort — see `reportFlakes`. Nothing here can fail a run.
 */
export default class FlakeReporter implements Reporter {
  readonly #outcomes: TestOutcome[] = [];
  readonly #repoRoot: string;
  readonly #options: IngestOptions;
  #warned = false;

  constructor(_globalConfig?: unknown, options: IngestOptions = {}) {
    this.#options = options;
    this.#repoRoot = repoRoot(options.env);
  }

  onTestCaseResult(test: Test, testCaseResult: TestCaseResult): void {
    // jest calls this from an unawaited event listener, so a throw here would
    // surface inside the test run itself and fail it.
    try {
      const outcome = toOutcome(testCaseResult, toRepoRelative(test.path, this.#repoRoot));
      // Keeping only attempts that could form a fail-then-pass pair is what stops
      // same-titled tests being merged into a phantom flake, and leaves a green
      // run retaining nothing.
      if (canContributeToFlake(outcome)) this.#outcomes.push(outcome);
    } catch (error) {
      this.#warnOnce(`could not record a test result: ${(error as Error).message}`);
    }
  }

  async onRunComplete(_contexts?: Set<TestContext>, _results?: AggregatedResult): Promise<void> {
    // A reporter that throws here fails an otherwise healthy run. Flake
    // reporting is never worth that, so nothing is allowed out of this method.
    try {
      const flakes = detectFlakes(this.#outcomes);
      if (flakes.length === 0) return;

      // Name them in the log, always. jest reports only a test's final outcome,
      // so a retried test that passed looks identical to one that never failed —
      // without this, a flake leaves no trace anyone reading the run would see.
      // This happens whether or not delivery is configured or succeeds.
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
      this.#warnOnce(`flake reporting failed: ${(error as Error).message}`);
    }
  }

  /** Warn at most once per run, so a systematic fault cannot spam the log per test. */
  #warnOnce(message: string): void {
    if (this.#warned) return;
    this.#warned = true;
    const warn = this.#options.warn ?? ((text: string) => console.warn(text));
    warn(`[test-quarantine] ${message} — continuing.`);
  }
}
