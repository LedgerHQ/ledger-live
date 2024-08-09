import { allure } from "allure-playwright";
import { Page, TestInfo } from "@playwright/test";
import { promisify } from "util";
import fs from "fs";
const readFileAsync = promisify(fs.readFile);

export async function addTmsLink(ids: string[]) {
  for (const id of ids) {
    await allure.tms(id, `https://ledgerhq.atlassian.net/browse/${id}`);
  }
}

export async function captureArtifacts(page: Page, testInfo: TestInfo) {
  const screenshot = await page.screenshot();
  await testInfo.attach("Screenshot", { body: screenshot, contentType: "image/png" });

  if (page.video()) {
    const finalVideoPath = await page.video()?.path();
    if (finalVideoPath) {
      console.log(`Video for test recorded at: ${finalVideoPath}\n`);
      const videoData = await readFileAsync(finalVideoPath);
      await testInfo.attach("Test Video", { body: videoData, contentType: "video/webm" });
    }
  }
}
