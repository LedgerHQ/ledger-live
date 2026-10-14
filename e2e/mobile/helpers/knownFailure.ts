import { $Set } from "jest-metadata";
import { $Issue } from "jest-allure2-reporter/api";

/**
 * Flags the next `describe` / `it` as a known failure: it still runs once and still reports
 * failed, but jest.reporter.js keeps it out of Detox's retry. Place it right before the block.
 */
export const $KnownFailure = (issue: string) => {
  // Must match KNOWN_FAILURE_KEY in jest.reporter.js.
  $Set("ledger.knownFailure", issue);
  $Issue(issue);
};
