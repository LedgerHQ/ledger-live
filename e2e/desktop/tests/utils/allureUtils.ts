import { Page, TestInfo } from "@playwright/test";
import { ElectronApplication } from "@playwright/test";
import { promisify } from "util";
import { readFile } from "fs";
import { takeScreenshot } from "@ledgerhq/live-common/e2e/speculos";
import * as allure from "allure-js-commons";
import { isLastRetry } from "tests/utils/testInfoUtils";

const readFileAsync = promisify(readFile);
const IS_NOT_MOCK = process.env.MOCK == "0";

export async function addTmsLink(ids: string[]) {
  for (const id of ids) {
    await allure.tms(id);
  }
}

export async function addBugLink(ids: string[]) {
  for (const id of ids) {
    await allure.issue(id);
  }
}

export async function captureArtifacts(
  page: Page,
  testInfo: TestInfo,
  electronApp: ElectronApplication,
) {
  const screenshot = await page.screenshot();
  await testInfo.attach("Screenshot", { body: screenshot, contentType: "image/png" });

  if (IS_NOT_MOCK) {
    const speculosScreenshot = await takeScreenshot();
    await testInfo.attach("Speculos Screenshot", {
      body: speculosScreenshot,
      contentType: "image/png",
    });
  }

  if (isLastRetry(testInfo)) {
    const filePath = `tests/artifacts/${testInfo.title.replace(/[^a-zA-Z0-9]/g, " ")}.json`;

    await page.evaluate(filePath => {
      window.saveLogs(filePath);
    }, filePath);

    await testInfo.attach("Test logs", {
      path: filePath,
      contentType: "application/json",
    });
  }

  const video = page.video();
  const videoPath = video ? await video.path() : null;
  if (videoPath) {
    await electronApp.close();
    console.log(`Video for test recorded at: ${videoPath}\n`);
    const videoData = await readFileAsync(videoPath);
    await testInfo.attach("Test Video", { body: videoData, contentType: "video/webm" });
  }
}
