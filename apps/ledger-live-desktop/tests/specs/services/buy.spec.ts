import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import * as server from "../../utils/serve-dummy-app";

test.use({
  userdata: "1AccountBTC1AccountETH",
  featureFlags: {
    ptxSmartRouting: {
      enabled: true,
      params: { liveAppId: "multibuy" },
    },
  },
  env: { DEV_TOOLS: true },
});

let continueTest = false;

test.beforeAll(async ({ request }) => {
  // Check that dummy app in tests/utils/dummy-app-build has been started successfully
  try {
    const port = await server.start("dummy-ptx-app/public");
    const response = await request.get(`http://localhost:${port}`);
    if (response.ok() && port) {
      continueTest = true;
      console.info(`========> Dummy test app successfully running on port ${port}! <=========`);
      process.env.MOCK_REMOTE_LIVE_MANIFEST = JSON.stringify(server.dummyLiveAppManifest(port));
    } else {
      throw new Error("Ping response != 200, got: " + response.status);
    }
  } catch (error) {
    console.warn(`========> Dummy test app not running! <=========`);
    console.error(error);
  }
});

test.afterAll(() => {
  server.stop();
  console.info(`========> Dummy test app stopped <=========`);
  delete process.env.MOCK_REMOTE_LIVE_MANIFEST;
});

test("Buy / Sell", async ({ page }) => {
  // Don't run test if server is not running
  if (!continueTest) return;

  const layout = new Layout(page);

  await test.step("Navigate to Buy app", async () => {
    await layout.goToBuyCrypto();
    await expect.soft(page).toHaveScreenshot("buy-app-opened.png");
  });
});
