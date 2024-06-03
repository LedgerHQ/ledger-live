import type { FullConfig, Reporter, Suite, TestCase, TestResult } from "@playwright/test/reporter";

interface XrayTestResult {
  testKey: string;
  status: string;
}

class XrayReporter implements Reporter {
  private testResults: XrayTestResult[] = [];

  onBegin(config: FullConfig, suite: Suite) {
    console.log(`Starting the run with ${suite.allTests().length} tests`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    console.log(`Finished test ${test.title}: ${result.status}`);
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
      console.log("Publishing test results to Xray");
      await publishToXray(this.testResults);
    }
  }
}

export default XrayReporter;
