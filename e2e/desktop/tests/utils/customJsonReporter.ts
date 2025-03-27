import { Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import * as fs from "fs";
import * as path from "path";

export function getDescription(annotations: any, type: "TMS" | "BUG") {
  const annotation = annotations.find((ann: any) => ann.type === type);
  return annotation ? annotation.description : "Type not found";
}

class JsonReporter implements Reporter {
  private readonly results: {
    info?: { summary: string; description: string };
    testExecutionKey?: string;
    tests: { testKey: string; status: string }[];
  } = {
    tests: [],
  };

  private testResults: { [testKey: string]: { testKey: string; status: string } } = {};

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
    const testKeys = getDescription(test.annotations, "TMS").split(", ");
    const status = result.status.toUpperCase();

    for (const testKey of testKeys) {
      this.testResults[testKey] = { testKey, status };
    }
  }

  async onExit(): Promise<void> {
    this.results.tests = Object.values(this.testResults);
    const outputPath = path.resolve("./tests/artifacts/xray/xray-report.json");
    const outputDir = path.dirname(outputPath);
    fs.mkdirSync(outputDir, { recursive: true });
    const json = JSON.stringify(this.results, null, 2);
    fs.writeFileSync(outputPath, json);
    console.log(`JSON report saved at: ${outputPath}`);
  }
}

export default JsonReporter;
