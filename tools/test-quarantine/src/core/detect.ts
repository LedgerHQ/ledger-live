import type { TestOutcome } from "./outcome.ts";

/** A test that failed at least once and then passed, within a single run. */
export interface Flake {
  file: string;
  title: string;
  /** Failure text from the last failing attempt before the test passed. */
  errorMessage?: string;
  /** How many retries it took to pass. A test that passed on its first retry is 1. */
  retryCount: number;
}

/**
 * Could this attempt be half of a fail-then-pass pair?
 *
 * A pass on the very first attempt cannot follow a failure of the same test, and
 * a skip is never part of a flake. Discarding those is not just an optimisation:
 * it is what stops tests that merely SHARE a title from being mistaken for one
 * test that failed and then passed.
 *
 * That case is real and common. `test.each` with a static title produces several
 * cases under a single `fullName`, and no runner exposes a stable per-case id, so
 * grouping cannot tell them apart. Without this filter, "case A failed on its
 * first attempt, case B passed on its first attempt" reads as a flake — and gets
 * reported with `retryCount: 0` on a run that is genuinely red.
 */
export function canContributeToFlake(outcome: TestOutcome): boolean {
  return outcome.status === "failed" || outcome.attempt > 0;
}

/**
 * Grouping key for one test. JSON encoding keeps the two fields unambiguous
 * without inventing a separator that a path or title might itself contain.
 */
function testKey(file: string, title: string): string {
  return JSON.stringify([file, title]);
}

/**
 * Group attempts by test, then flag every test that failed and later passed.
 *
 * This is deliberately the only place flakiness is defined. Each runner adapter
 * decides how to observe attempts; none of them decides what a flake is.
 */
export function detectFlakes(outcomes: TestOutcome[]): Flake[] {
  const attemptsByTest = new Map<string, TestOutcome[]>();
  for (const outcome of outcomes) {
    if (!canContributeToFlake(outcome)) continue;
    const key = testKey(outcome.file, outcome.title);
    const attempts = attemptsByTest.get(key);
    if (attempts) attempts.push(outcome);
    else attemptsByTest.set(key, [outcome]);
  }

  const flakes: Flake[] = [];
  for (const attempts of attemptsByTest.values()) {
    const flake = findFailThenPass(attempts);
    if (flake) flakes.push(flake);
  }
  return flakes;
}

/**
 * A test is a flake when an earlier attempt failed and a later one passed.
 *
 * The reported `errorMessage` comes from the last failure before that pass,
 * which is the failure someone debugging the flake will want to see.
 */
function findFailThenPass(attempts: TestOutcome[]): Flake | undefined {
  // Sorting by attempt alone is enough: the sort is stable, so attempts a runner
  // reported under the same index keep the order they arrived in.
  const ordered = [...attempts].sort((a, b) => a.attempt - b.attempt);

  let lastFailure: TestOutcome | undefined;
  for (const attempt of ordered) {
    if (attempt.status === "failed") {
      lastFailure = attempt;
    } else if (attempt.status === "passed" && lastFailure) {
      return {
        file: lastFailure.file,
        title: lastFailure.title,
        errorMessage: lastFailure.errorMessage,
        retryCount: attempt.attempt,
      };
    }
  }
  return undefined;
}
