import { Page, TestInfo } from "@playwright/test";
import { promisify } from "util";
import fs from "fs";

const readFileAsync = promisify(fs.readFile);

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

  const filePath = `tests/artifacts/${testInfo.title.replace(/[^a-zA-Z0-9]/g, " ")}.json`;

  await page.evaluate(filePath => {
    window.saveLogs(filePath);
  }, filePath);

  await testInfo.attach("Test logs", {
    path: filePath,
    contentType: "application/json",
  });
}
