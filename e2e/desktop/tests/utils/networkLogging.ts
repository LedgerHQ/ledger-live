import { Page, TestInfo } from "@playwright/test";
import { safeAppendFile } from "./fileUtils";

export function attachNetworkLogging(page: Page, testInfo: TestInfo) {
  const networkLogPath = testInfo.outputPath("network.log");

  page.on("requestfailed", request => {
    const failure = request.failure();
    safeAppendFile(
      networkLogPath,
      [
        "=== REQUEST FAILED ===",
        `${request.method()} ${request.url()}`,
        `error: ${failure?.errorText}`,
        "",
      ].join("\n"),
    );
  });

  page.on("response", response => {
    if (response.status() >= 400) {
      safeAppendFile(
        networkLogPath,
        ["=== RESPONSE ERROR ===", `${response.status()} ${response.url()}`, ""].join("\n"),
      );
    }
  });

  return networkLogPath;
}
