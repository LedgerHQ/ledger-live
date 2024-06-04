import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../component/layout.component";

test.use({ userdata: "skip-onboarding" });

test.use({
  env: {
    SEGMENT_TEST: "true",
  },
});

test("Segment", async ({ page }) => {
  const layout = new Layout(page);
  const firstSuccessfulQuery = new Promise((resolve, reject) => {
    page.on("response", response => {
      if (response.url().startsWith("https://api.segment.io")) {
        if (response.status() === 200) {
          resolve(response);
        } else {
          reject(new Error("segment http error " + response.status()));
        }
      }
    });
  });

  const firstAnalyticsEventRequestData: Promise<{ userId?: string }> = new Promise(resolve => {
    page.on("request", request => {
      if (request.url() === "https://api.segment.io/v1/t") {
        const data = request.postDataJSON();
        resolve(data);
      }
    });
  });

  await test.step("has analytics settled", async () => {
    const hasAnalytics = await page.evaluate(() => !!window.analytics);
    expect(hasAnalytics).toBe(true);
    await layout.goToSettings();
    await page.waitForFunction(() => "Integrations" in window.analytics);
  });

  await test.step("has sent event with userId settled", async () => {
    const data = await firstAnalyticsEventRequestData;
    expect(data?.userId).toBeTruthy();
  });

  await test.step("has sent events in HTTP", async () => {
    expect(await firstSuccessfulQuery).toBeDefined();
  });
});
