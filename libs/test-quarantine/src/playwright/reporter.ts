import type { FullResult, Reporter, TestCase, TestResult } from "@playwright/test/reporter";

function parseOptionalQuarantine(test: TestCase): { id: string; reason: string } | null {
  for (const ann of test.annotations) {
    if (ann.type !== "quarantine" || !ann.description?.startsWith("optional:")) {
      continue;
    }
    const rest = ann.description.slice("optional:".length);
    const idx = rest.indexOf(":");
    if (idx === -1) {
      return null;
    }
    return { id: rest.slice(0, idx), reason: rest.slice(idx + 1) };
  }
  return null;
}

/**
 * Downgrades suite exit status when every failure is an `failureMode: optional` quarantine.
 */
export default class QuarantineReporter implements Reporter {
  private hadFailure = false;

  private hadNonQuarantineFailure = false;

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === "passed" || result.status === "skipped") {
      return;
    }
    this.hadFailure = true;
    const q = parseOptionalQuarantine(test);
    if (q) {
      // eslint-disable-next-line no-console
      console.log(`QUARANTINE-FLAKY ${q.id} — ${test.title} (${result.status})`);
    } else {
      this.hadNonQuarantineFailure = true;
    }
  }

  async onEnd(result: FullResult): Promise<{ status: "passed" } | undefined> {
    if (result.status !== "failed") {
      return undefined;
    }
    if (this.hadFailure && !this.hadNonQuarantineFailure) {
      // eslint-disable-next-line no-console
      console.log(
        "[test-quarantine] All failures were optional quarantine entries; treating suite as passed for exit code.",
      );
      return { status: "passed" };
    }
    return undefined;
  }

  printsToStdio(): boolean {
    return false;
  }
}
