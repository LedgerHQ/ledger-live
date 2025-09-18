import * as core from "@actions/core";
import { executeSyntheticsTests } from "./commands/synthetics";
import { executePerformanceReport } from "./commands/performance";
import { executeComparison } from "./commands/comparison";

export default async function run() {
  try {
    const testResult = await executeSyntheticsTests();
    const performanceReport = executePerformanceReport(testResult);
    await executeComparison(performanceReport);
  } catch (error) {
    core.setFailed(`Mobile performance test failed:\n${error}`);
  }
}

if (require.main === module) {
  run();
}
