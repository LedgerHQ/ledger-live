import { Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import { ReportingUtils } from "./xray-reporter";

interface XrayTestResult {
  testKey: string;
  status: string;
}

class XrayReporter implements Reporter {
  private testResults: XrayTestResult[] = [];

  onTestEnd(test: TestCase, result: TestResult) {
    const tmsIds = this.getTmsIds(test);
    for (const tmsId of tmsIds) {
      let status: string;
      switch (result.status) {
        case "skipped":
          status = "TODO";
          break;
        case "passed":
          status = "PASSED";
          break;
        case "failed":
          status = "FAILED";
          break;
        default:
          status = "TODO";
      }
      this.testResults.push({ testKey: tmsId, status });
    }
  }

  async onEnd() {
    if (process.env.IS_XRAY) {
      await ReportingUtils.publishToXray(this.testResults);
    }
  }

  private getTmsIds(test: TestCase): string[] {
    return test.annotations
      .filter(annotation => annotation.type === "TMS")
      .map(annotation => annotation.description);
  }
}

export default XrayReporter;
