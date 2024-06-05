import { Test, Result, Info } from "../models/xray"; // todo: verifier si vraiment utile car j'ai XML
import XrayService from "./xray.service";

const testPlanKey = process.env.TEST_PLAN_KEY;

export class ReportingUtils {
  private constructor() {}
  // xmlFilePath: string => Dans mon cas
  public static publishToXray(testResults: Test[]): void {
    const xrayResult = testResults.filter(testResult => testResult.testKey !== null);

    if (xrayResult.length === 0) {
      console.warn("No test results to publish");
      return;
    }

    const result = new Result();
    result.tests = xrayResult;

    let runId: string;
    if (!testPlanKey) {
      const testRunName = `Execution of automated tests - ${new Date().toISOString()}`;
      const info = new Info();
      info.summary = testRunName;
      info.description = "This execution is automatically created when running automated tests";
      result.info = info;
      console.info("Creating Test Run...");
      XrayService.importExecution(result);
      console.info(`Test Run was created: https://ledgerhq.atlassian.net/browse/${testPlanKey}`);
    } else {
      runId = testPlanKey;
      result.testExecutionKey = runId;
      console.info(`Updating Test Run: '${runId}' ...`);
      XrayService.importExecution(result);
      console.info(`Test Run was updated: https://ledgerhq.atlassian.net/browse/${testPlanKey}`);
    }
  }
}
