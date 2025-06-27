import fs, { appendFile } from "fs/promises";

export async function safeAppendFile(filePath: string, data: string) {
  try {
    await appendFile(filePath, data);
  } catch (e: any) {
    if (e) console.error("couldn't append file", e);
  }
}

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
  static async waitForFileToExist(filePath: string, timeout: number): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      try {
        await fs.access(filePath);
        return true;
      } catch (e: any) {
        console.error("Error in waitForFileToExist : ", e);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return false;
  }
}
