import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { DiscoverPage } from "../../models/DiscoverPage";
import { Layout } from "../../models/Layout";
import { Drawer } from "../../models/Drawer";
import { Modal } from "../../models/Modal";
import { DeviceAction } from "../../models/DeviceAction";
import * as server from "../../utils/serve-dummy-app";

test.use({ userdata: "1AccountBTC1AccountETH" });

let continueTest = false;

test.beforeAll(async ({ request }) => {
  // Check that dummy app in tests/utils/dummy-app-build has been started successfully
  try {
    const port = await server.start("dummy-live-app/build");
    const response = await request.get(`http://localhost:${port}`);
    if (response.ok()) {
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

// Due to flakiness on different OS's and CI, we won't run the screenshots where unncessary for testing
test("Discover", async ({ page }) => {
  // Don't run test if server is not running
  if (!continueTest) return;

  const discoverPage = new DiscoverPage(page);
  const drawer = new Drawer(page);
  const modal = new Modal(page);
  const layout = new Layout(page);
  const deviceAction = new DeviceAction(page);

  await test.step("Navigate to dummy live app", async () => {
    await layout.goToDiscover();
    await discoverPage.openTestApp();
    await drawer.continue();
    await drawer.waitForDrawerToDisappear(); // macos runner was having screenshot issues here because the drawer wasn't disappearing fast enough
    await discoverPage.waitForCorrectTextInWebview("Ledger Live Dummy Test App");
    await expect.soft(page).toHaveScreenshot("live-disclaimer-accepted.png");
  });

  await test.step("List all accounts", async () => {
    await discoverPage.getAccountsList();
    await discoverPage.waitForCorrectTextInWebview("mock:1:bitcoin:true_bitcoin_0:");
    await discoverPage.waitForCorrectTextInWebview("mock:1:bitcoin:true_bitcoin_1:");
    await expect.soft(page).toHaveScreenshot("live-app-list-all-accounts.png");
  });

  await test.step("Request Account drawer - open", async () => {
    await discoverPage.requestAsset();
    await expect(discoverPage.selectAssetTitle).toBeVisible();
  });

  await test.step("Request Account - select asset", async () => {
    await discoverPage.selectAsset();
    await expect(discoverPage.selectAccountTitle).toBeVisible();
    await expect(discoverPage.selectAssetSearchBar).toBeEnabled();
  });

  await test.step("Request Account - select BTC", async () => {
    await discoverPage.selectAccount();
    await drawer.waitForDrawerToDisappear();
    await discoverPage.waitForCorrectTextInWebview("mock:1:bitcoin:true_bitcoin_0:");
    await expect.soft(page).toHaveScreenshot("live-app-request-account-output.png");
  });

  await test.step("List currencies", async () => {
    await discoverPage.listCurrencies();
    await discoverPage.waitForCorrectTextInWebview("CryptoCurrency");
    await expect.soft(page).toHaveScreenshot("live-app-list-currencies.png");
  });

  await test.step("Verify Address - modal", async () => {
    await discoverPage.verifyAddress();
    await deviceAction.openApp();
    await expect.soft(page).toHaveScreenshot("live-app-verify-address.png");
  });

  await test.step("Verify Address - address output", async () => {
    await modal.waitForModalToDisappear();
    await discoverPage.waitForCorrectTextInWebview("1xey");
    await expect.soft(page).toHaveScreenshot("live-app-verify-address-output.png");
  });

  await test.step("Sign Transaction - info modal", async () => {
    await discoverPage.signTransaction();
    await expect.soft(page).toHaveScreenshot("live-app-sign-transaction-info.png", {
      timeout: 20000,
    });
  });

  await test.step("Sign Transaction - confirmation modal", async () => {
    await discoverPage.continueToSignTransaction();
    await layout.waitForLoadingSpinnerToHaveDisappeared();
    await discoverPage.waitForConfirmationScreenToBeDisplayed();
    await expect(page.locator("text=0.0000123")).toBeVisible();
    await expect(page.locator("text=0.0000025")).toBeVisible();
    // This screenshot is flaky as the loading spinner appears again after this confirm modal, and on slow CI runners the screenshot can take a picture of this instead of the confirm.
    // await expect.soft(page).toHaveScreenshot("live-app-sign-transaction-confirm.png");
  });

  await test.step("Sign Transaction - signature output", async () => {
    await modal.waitForModalToDisappear();
    await discoverPage.waitForCorrectTextInWebview("mock_op_100");
    await expect.soft(page).toHaveScreenshot("live-app-sign-transaction-output.png");
  });
});
