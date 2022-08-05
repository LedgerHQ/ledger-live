import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";

test.use({ userdata: "skip-onboarding" });

test.use({
  env: {
    SEGMENT_TEST: true,
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

  await test.step("has analytics.Integrations defined", async () => {
    await layout.goToSettings();
    const hasIntegrations = await page.evaluate(() => "Integrations" in (window as any).analytics);
    expect(hasIntegrations).toBe(true);
  });

  await test.step("has sent events in HTTP", async () => {
    expect(await firstSuccessfulQuery).toBeDefined();
  });
});
