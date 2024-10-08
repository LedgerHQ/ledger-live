import { tms, attachment } from "allure-js-commons";
import { Page, TestInfo } from "@playwright/test";
import { promisify } from "util";
import fs from "fs";
import { takeScreenshot } from "@ledgerhq/live-common/e2e/speculos";

const readFileAsync = promisify(fs.readFile);
const IS_NOT_MOCK = process.env.MOCK == "0";

export async function addTmsLink(ids: string[]) {
  for (const id of ids) {
    await tms(`https://ledgerhq.atlassian.net/browse/${id}`, id);
  }
}

export async function captureArtifacts(page: Page, testInfo: TestInfo) {
  const screenshot = await page.screenshot();
  await attachment("Screenshot", screenshot, { contentType: "image/png" });

  if (IS_NOT_MOCK) {
    const speculosScreenshot = await takeScreenshot();
    await attachment("Speculos Screenshot", speculosScreenshot, { contentType: "image/png" });
  }

  if (page.video()) {
    const finalVideoPath = await page.video()?.path();
    if (finalVideoPath) {
      console.log(`Video for test recorded at: ${finalVideoPath}\n`);
      const videoData = await readFileAsync(finalVideoPath);
      await attachment("Test Video", videoData, { contentType: "video/webm" });
    }
  }

  const filePath = `tests/artifacts/${testInfo.title.replace(/[^a-zA-Z0-9]/g, " ")}.json`;

  await page.evaluate(filePath => {
    window.saveLogs(filePath);
  }, filePath);

  await attachment("Test logs", filePath, { contentType: "application/json" });
}
