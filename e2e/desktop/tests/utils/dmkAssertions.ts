import { expect } from "@playwright/test";
import { readFile } from "fs/promises";
import type { TestInfo } from "@playwright/test";

export async function assertDmkPaths(testInfo: TestInfo, family?: string) {
  const logContent = await readFile(testInfo.outputPath("logs.log"), "utf-8");

  if (family === "solana") {
    expect(logContent).toContain("using DmkSignerSol");
    expect(logContent).not.toContain("using LegacySignerSolana");
  }
}
