import { TestInfo } from "@playwright/test";
import { PAYTAB_SPECS_DIR } from "tests/reporters/cardSessionReporter";

/** True when this run is the last attempt */
export function isLastRetry(testInfo: TestInfo): boolean {
  return testInfo.retry === (testInfo.project?.retries ?? 0);
}

export const isPaytabTest = (testInfo: TestInfo): boolean =>
  testInfo.file.replaceAll("\\", "/").includes(`/${PAYTAB_SPECS_DIR}/`);
