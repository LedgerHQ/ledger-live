import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { LiveAppWebview } from "../../models/LiveAppWebview";

test.use({
  userdata: "1AccountBTC1AccountETH",
  featureFlags: {
    ptxEarn: {
      enabled: true,
    },
  },
});

let testServerIsRunning = false;

test.beforeAll(async () => {
  // Check that dummy app in libs/test-utils/dummy-ptx-app has been started successfully
  testServerIsRunning = await LiveAppWebview.startLiveApp("dummy-ptx-app/public", {
    name: "Earn",
    id: "earn",
    apiVersion: "^2.0.0",
    permissions: [
      {
        method: "account.list",
      },
    ],
  });

  if (!testServerIsRunning) {
    console.warn("Stopping Earn test setup");
    return;
  }
});

test.afterAll(async () => {
  if (testServerIsRunning) {
    await LiveAppWebview.stopLiveApp();
  }
});

test("Earn @smoke", async ({ page }) => {
  if (!testServerIsRunning) {
    console.warn("Test server not running - Cancelling Earn E2E test");
    return;
  }

  const layout = new Layout(page);
  const liveAppWebview = new LiveAppWebview(page);

  await test.step("Navigate to Buy app from portfolio banner", async () => {
    await layout.goToEarn();
    await expect(await liveAppWebview.waitForCorrectTextInWebview("theme: dark")).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("lang: en")).toBe(true);
    await expect(await liveAppWebview.waitForCorrectTextInWebview("currencyTicker: USD")).toBe(
      true,
    );
    await expect
      .soft(page)
      .toHaveScreenshot("earn-app-opened.png", { mask: [page.locator("webview")] });
  });
});
