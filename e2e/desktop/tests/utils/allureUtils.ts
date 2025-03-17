import { allure } from "allure-playwright";
import { Page, TestInfo } from "@playwright/test";
import { promisify } from "util";
import fs from "fs";
import { takeScreenshot } from "@ledgerhq/live-common/e2e/speculos";

const readFileAsync = promisify(fs.readFile);
const IS_NOT_MOCK = process.env.MOCK == "0";

export async function addTmsLink(ids: string[]) {
  for (const id of ids) {
    await allure.tms(id, `https://ledgerhq.atlassian.net/browse/${id}`);
  }
}

export async function addBugLink(ids: string[]) {
  for (const id of ids) {
    await allure.issue(id, `https://ledgerhq.atlassian.net/browse/${id}`);
  }
}

export async function captureArtifacts(page: Page, testInfo: TestInfo) {
  const screenshot = await page.screenshot();
  await testInfo.attach("Screenshot", { body: screenshot, contentType: "image/png" });

  if (IS_NOT_MOCK) {
    const speculosScreenshot = await takeScreenshot();
    await testInfo.attach("Speculos Screenshot", {
      body: speculosScreenshot,
      contentType: "image/png",
    });
  }

  if (page.video()) {
    const finalVideoPath = await page.video()?.path();
    if (finalVideoPath) {
      console.log(`Video for test recorded at: ${finalVideoPath}\n`);
      const videoData = await readFileAsync(finalVideoPath);
      await testInfo.attach("Test Video", { body: videoData, contentType: "video/webm" });
    }
  }

  const filePath = `tests/artifacts/${testInfo.title.replace(/[^a-zA-Z0-9]/g, " ")}.json`;

  await page.evaluate(filePath => {
    window.saveLogs(filePath);
  }, filePath);

  await testInfo.attach("Test logs", {
    path: filePath,
    contentType: "application/json",
  });
}
