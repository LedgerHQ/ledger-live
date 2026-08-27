/** Whether a single attempt at a test passed, failed, or never ran. */
export type TestStatus = "passed" | "failed" | "skipped";

/**
 * One attempt at running one test, normalised across runners.
 *
 * Every runner adapter produces these and nothing else; the rest of the tool is
 * runner-agnostic. "Attempt" is the important part: a test that jest retried
 * twice produces three outcomes, not one.
 */
export interface TestOutcome {
  /** Repo-relative path of the test file, always with forward slashes. */
  file: string;
  /** Full test title: ancestor describe titles and the test title, space-joined. */
  title: string;
  /** 0-based attempt index. 0 is the first run, 1 the first retry. */
  attempt: number;
  status: TestStatus;
  /** Failure text for this attempt. Only meaningful when `status` is "failed". */
  errorMessage?: string;
  /**
   * Runner-specific discriminator for tests that share a file and title but are
   * genuinely separate runs of it — a Playwright project, for instance.
   *
   * It groups attempts and is never reported: two projects running the same spec
   * are two tests that can flake independently, but the reported title should
   * stay the test's own title.
   */
  variant?: string;
}
