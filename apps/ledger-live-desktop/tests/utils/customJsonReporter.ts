import { Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import * as fs from "fs";
import * as path from "path";

export function getDescription(annotations: any) {
  const annotation = annotations.find((ann: any) => ann.type === "TMS" || ann.type === "BUG");
  return annotation ? annotation.description : "Type not found";
}

class JsonReporter implements Reporter {
  private results: {
    info?: { summary: string; description: string };
    testExecutionKey?: string;
    tests: { testKey: string; status: string }[];
  } = {
    tests: [],
  };

  constructor() {
    if (!process.env.TEST_EXECUTION) {
      this.results.info = {
        summary: "Speculos test execution",
        description:
          "This execution is automatically created when importing execution results from an external source",
      };
    } else {
      this.results.testExecutionKey = process.env.TEST_EXECUTION;
    }
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const testKeys = getDescription(test.annotations).split(", ");
    const status = result.status.toUpperCase();
    testKeys.forEach((testKey: string) => {
      this.results.tests.push({ testKey, status });
    });
  }

  async onExit(): Promise<void> {
    const outputPath = path.resolve("./tests/artifacts/xray/xray-report.json");
    const outputDir = path.dirname(outputPath);
    fs.mkdirSync(outputDir, { recursive: true });
    const json = JSON.stringify(this.results, null, 2);
    fs.writeFileSync(outputPath, json);
    console.log(`JSON report saved at: ${outputPath}`);
  }
}

export default JsonReporter;
