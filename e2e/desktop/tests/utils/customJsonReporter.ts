import { FullResult, Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import * as fs from "fs";
import * as path from "path";
import {
  buildXrayReport,
  type XrayResult,
  type XrayStatus,
} from "@ledgerhq/live-e2e-shared/xray/report";
import { isXrayPublishEnabled, XrayClient } from "@ledgerhq/live-e2e-shared/xray/client";
import { parseXrayAnnotations } from "@ledgerhq/live-e2e-shared/xray/annotations";

export function getDescription(annotations: any, type: "TMS" | "BUG") {
  const annotation = annotations.find((ann: any) => ann.type === type);
  return annotation ? annotation.description : "";
}

/** Playwright statuses are not Xray statuses — `timedOut` would be rejected verbatim. */
const XRAY_STATUS: Record<TestResult["status"], XrayStatus> = {
  passed: "PASSED",
  failed: "FAILED",
  timedOut: "FAILED",
  interrupted: "ABORTED",
  skipped: "TODO",
};

const OUTPUT_PATH = path.resolve("./tests/artifacts/xray/xray-report.json");
/** Written next to the report so CI can surface the execution it created. */
const EXECUTION_KEY_PATH = path.resolve("./tests/artifacts/xray/xray-execution-key.txt");

/** Playwright errors carry a full stack and ANSI codes; Xray only needs the gist. */
function firstLines(message: string | undefined, max = 5): string | undefined {
  if (!message) return undefined;
  // eslint-disable-next-line no-control-regex -- strip ANSI colour codes
  const plain = message.replace(/\[[0-9;]*m/g, "").trim();
  return plain ? plain.split("\n").slice(0, max).join("\n") : undefined;
}

/**
 * Collects Xray results and publishes them at the end of the run.
 *
 * The report is always written to disk for the CI artifact; it is only uploaded when
 * `XRAY_ENABLED=true` and credentials are present, so the reporter is safe to keep registered.
 * Publishing failures are logged, never thrown — reporting must not fail a green test run.
 */
class JsonReporter implements Reporter {
  private readonly results: XrayResult[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    const status = XRAY_STATUS[result.status];
    const comment = firstLines(result.error?.message);
    const { plainKeys, datasets } = parseXrayAnnotations(result.annotations);

    for (const testKey of plainKeys) {
      this.results.push({ testKey, status, runId: test.id, comment });
    }
    for (const dataset of datasets) {
      this.results.push({ ...dataset, status, runId: test.id, comment });
    }
  }

  async onEnd(_result: FullResult): Promise<void> {
    const report = buildXrayReport(this.results, {
      testExecutionKey: process.env.TEST_EXECUTION,
      info: {
        summary: "Speculos test execution",
        description:
          "This execution is automatically created when importing execution results from an external source",
      },
    });

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2));
    console.log(`Xray report saved at: ${OUTPUT_PATH}`);

    if (!isXrayPublishEnabled(process.env)) return;

    // Xray REPLACES a Test Run's iterations on import rather than merging them, so publishing an
    // empty payload would delete rows that are already there.
    if (report.tests.length === 0) {
      console.warn("[xray] nothing to publish — no Xray-keyed tests ran.");
      return;
    }

    try {
      const client = new XrayClient({
        clientId: process.env.XRAY_CLIENT_ID!,
        clientSecret: process.env.XRAY_CLIENT_SECRET!,
        baseUrl: process.env.XRAY_API_URL,
      });
      const key = await client.importExecution(report);
      fs.writeFileSync(EXECUTION_KEY_PATH, key);
      console.log(`Xray execution: https://ledgerhq.atlassian.net/browse/${key}`);
    } catch (error) {
      console.error("[xray] failed to publish results:", error);
    }
  }
}

export default JsonReporter;
