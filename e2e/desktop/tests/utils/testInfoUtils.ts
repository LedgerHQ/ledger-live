import { TestInfo } from "@playwright/test";

/** True when this run is the last attempt */
export function isLastRetry(testInfo: TestInfo): boolean {
  return testInfo.retry === (testInfo.project?.retries ?? 0);
}
