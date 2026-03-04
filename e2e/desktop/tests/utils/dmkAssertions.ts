import { expect } from "@playwright/test";
import { readFile } from "fs/promises";
import type { TestInfo } from "@playwright/test";

export async function assertDmkPaths(testInfo: TestInfo, family?: string) {
  const logContent = await readFile(testInfo.outputPath("logs.log"), "utf-8");
  expect(logContent).toContain("connectApp: using DMK ConnectAppDeviceAction");
  expect(logContent).not.toContain("connectApp: legacy path");
  if (family === "evm") {
    expect(logContent).toContain("using DmkSignerEth");
    expect(logContent).not.toContain("using LegacySignerEth");
  }
}
