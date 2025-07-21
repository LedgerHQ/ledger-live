import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../component/layout.component";
import { LiveAppWebview } from "../../models/LiveAppWebview";

test.use({
  userdata: "1AccountBTC1AccountETH",
});

let testServerIsRunning = false;

test.beforeAll(async () => {
  // Check that dummy app in tests/dummy-ptx-app has been started successfully
  testServerIsRunning = await LiveAppWebview.startLiveApp("dummy-ptx-app/public", {
    name: "Earn",
    id: "earn",
    apiVersion: "^2.0.0",
    permissions: ["account.list"],
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

test("Earn @smoke", async ({ page, electronApp }) => {
  if (!testServerIsRunning) {
    console.warn("Test server not running - Cancelling Earn E2E test");
    return;
  }

  const layout = new Layout(page);
  const liveAppWebview = new LiveAppWebview(page, electronApp);

  await test.step("Navigate to Buy app from portfolio banner", async () => {
    await layout.goToEarn();
    await liveAppWebview.waitForText("theme: dark");
    await liveAppWebview.waitForText("lang: en");
    await liveAppWebview.waitForText("locale: en-US");
    await liveAppWebview.waitForText("discreetMode: false");
    await liveAppWebview.waitForText("currencyTicker: USD");
    await expect
      .soft(page)
      .toHaveScreenshot("earn-app-opened.png", { mask: [page.locator("webview")] });
  });
});
