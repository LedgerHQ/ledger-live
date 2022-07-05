import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { DiscoverPage } from "../../models/DiscoverPage";
import { Layout } from "../../models/Layout";
import { Modal } from "tests/models/Modal";
import { Drawer } from "tests/models/Drawer";
import * as server from "../../utils/serve-dummy-app";

// Comment out to disable recorder
// process.env.PWDEBUG = "1";

test.use({ userdata: "1AccountBTC1AccountETH" });

let continueTest = false;

test.beforeAll(async ({ request }) => {
  // Check that dummy app in tests/utils/dummy-app-build has been started successfully
  try {
    const port = await server.start();
    const response = await request.get(`http://localhost:${port}`);
    if (response.ok()) {
      continueTest = true;
      console.info(`========> Dummy test app successfully running on port ${port}! <=========`);
      process.env.MOCK_REMOTE_LIVE_MANIFEST = JSON.stringify(server.manifest(port));
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

// Due to flakiness on different OS's and CI, we won't run the screenshots where unncessary for testing
test("Discover", async ({ page }) => {
  // Don't run test if server is not running
  if (!continueTest) return;

  const discoverPage = new DiscoverPage(page);
  const drawer = new Drawer(page);
  const modal = new Modal(page);
  const layout = new Layout(page);

  await test.step("Navigate to catalog", async () => {
    await layout.goToDiscover();
    await expect.soft(page).toHaveScreenshot("catalog.png");
  });

  await test.step("Launch Test App", async () => {
    await discoverPage.launchApp();
    await expect.soft(page).toHaveScreenshot("open-test-app.png");
  });

  await test.step("Accept Live App Disclaimer", async () => {
    await drawer.continue();
    await drawer.waitForDrawerToDisappear(); // macos runner was having screenshot issues here because the drawer wasn't disappearing fast enough
    await layout.waitForLoadingSpinnerToHaveDisappeared();
    await expect.soft(page).toHaveScreenshot("live-disclaimer-accepted.png");
  });

  await test.step("List all accounts", async () => {
    await discoverPage.getAccountsList();
    await expect.soft(page).toHaveScreenshot("live-app-list-all-accounts.png");
  });

  await test.step("Request Account modal - open", async () => {
    await discoverPage.requestAccount();
    await expect.soft(page).toHaveScreenshot("live-app-request-account-modal-1.png");
  });

  await test.step("Request Account - account dropdown", async () => {
    await discoverPage.openAccountDropdown();
    await expect.soft(page).toHaveScreenshot("live-app-request-account-modal-2.png");
  });

  await test.step("Request Account - select BTC", async () => {
    await discoverPage.selectAccount("BTC");
    await expect.soft(page).toHaveScreenshot("live-app-request-account-modal-3.png");
  });

  await test.step("Request Account - single account output", async () => {
    await modal.continue();
    await expect.soft(page).toHaveScreenshot("live-app-request-single-account-output.png");
  });
});
