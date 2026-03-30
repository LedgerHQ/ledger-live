import { access, appendFile, mkdir, rename, stat } from "fs/promises";
import * as path from "path";
import { expect } from "@playwright/test";
import { step } from "tests/misc/reporters/step";

export const NANO_APP_CATALOG_PATH = "tests/artifacts/appVersion/nano-app-catalog.json";

export async function safeAppendFile(filePath: string, data: string) {
  try {
    await appendFile(filePath, data);
  } catch (e: any) {
    if (e) console.error("couldn't append file", e);
  }
}

export class FileUtils {
  @step("get app.json size")
  static async getAppJsonSize(userdataFile: string) {
    const fileStats = await stat(userdataFile);
    return fileStats.size;
  }

  @step("Compare 2 app.json files")
  static async compareAppJsonSize(appJson1: number, appJson2: number) {
    expect(appJson1).not.toEqual(appJson2);
  }

  @step("Wait for file to exist after clicking download")
  static async waitForFileToExist(filePath: string, timeout: number): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        await access(filePath);
        return true;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return false;
  }

  @step("Wait for file to exist and move to target path")
  static async waitForFileAndMove(
    sourcePath: string,
    targetPath: string,
    timeout: number = 10000,
  ): Promise<void> {
    const fileExists = await FileUtils.waitForFileToExist(sourcePath, timeout);
    expect(
      fileExists,
      `Export file was not created at ${sourcePath} within ${timeout}ms`,
    ).toBeTruthy();

    const targetDir = path.dirname(targetPath);
    await mkdir(targetDir, { recursive: true });
    await rename(sourcePath, targetPath);
  }
}
