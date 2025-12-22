import fs from "fs/promises";
import { sanitizeError } from "@ledgerhq/live-common/e2e/index";

export class FileUtils {
  @Step("get app.json size")
  static async getAppJsonSize(userdataFile: string) {
    const fileStats = await fs.stat(userdataFile);
    return fileStats.size;
  }

  @Step("Compare 2 app.json files")
  static async compareAppJsonSize(appJson1: number, appJson2: number) {
    jestExpect(appJson1).not.toEqual(appJson2);
  }

  @Step("Wait for file to exist after clicking download")
  static async waitForFileToExist(filePath: string, timeout: number = 5000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        await fs.access(filePath);
        return true;
      } catch (error) {
        console.error("Error in waitForFileToExist:", sanitizeError(error));
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return false;
  }

  @Step("Read file as string")
  static async readFileAsString(filePath: string): Promise<string> {
    try {
      const base64Content = await fs.readFile(filePath, "utf8");
      const decodedContent = this.decodeBase64Content(base64Content);
      return this.parseJsonString(decodedContent);
    } catch (error) {
      throw new Error(`Error reading or processing file at ${filePath}: ${sanitizeError(error)}`);
    }
  }

  static decodeBase64Content(base64Content: string): string {
    try {
      return Buffer.from(base64Content, "base64").toString("utf8");
    } catch (error) {
      throw new Error(`Failed to decode base64 content: ${sanitizeError(error)}`);
    }
  }

  static parseJsonString(jsonString: string): string {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error(`Failed to parse content JSON: ${sanitizeError(error)}`);
    }
  }
}
