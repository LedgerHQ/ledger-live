import fs from "fs/promises";

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
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error("Error in waitForFileToExist:", errorMessage);
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
    } catch (err) {
      throw new Error(`Error reading or processing file at ${filePath}: ${err}`);
    }
  }

  static decodeBase64Content(base64Content: string): string {
    try {
      return Buffer.from(base64Content, "base64").toString("utf8");
    } catch (err) {
      throw new Error(`Failed to decode base64 content: ${err}`);
    }
  }

  static parseJsonString(jsonString: string): string {
    try {
      return JSON.parse(jsonString);
    } catch (err) {
      throw new Error(`Failed to parse content JSON: ${err}`);
    }
  }
}
