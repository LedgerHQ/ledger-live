import fs, { appendFile } from "fs/promises";
import { expect } from "@playwright/test";
import { step } from "../misc/reporters/step";

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
    const fileStats = await fs.stat(userdataFile);
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
        await fs.access(filePath);
        return true;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return false;
  }
}
