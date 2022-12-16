import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { DiscoverPage } from "../../models/DiscoverPage";
import { Layout } from "../../models/Layout";
import { Drawer } from "tests/models/Drawer";
import { Modal } from "tests/models/Modal";
import { DeviceAction } from "tests/models/DeviceAction";
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
  const deviceAction = new DeviceAction(page);

  await test.step("Navigate to dummy live app", async () => {
    await layout.goToDiscover();
    await discoverPage.openTestApp();
    await drawer.continue();
    await drawer.waitForDrawerToDisappear(); // macos runner was having screenshot issues here because the drawer wasn't disappearing fast enough
    await discoverPage.waitForLiveAppToLoad(); // let the loading spinner disappear first
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
    await expect(await discoverPage.selectAssetTitle.isVisible()).toBe(true);
  });

  await test.step("Request Account - select asset", async () => {
    await discoverPage.selectAsset();
    await expect(await discoverPage.selectAccountTitle.isVisible()).toBe(true);
    await expect(await discoverPage.selectAssetSearchBar.isEnabled()).toBe(true);
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
    await expect.soft(page).toHaveScreenshot("live-app-sign-transaction-confirm.png");
  });

  await test.step("Sign Transaction - signature output", async () => {
    await modal.waitForModalToDisappear();
    await discoverPage.waitForCorrectTextInWebview("mock_op_100");
    await expect.soft(page).toHaveScreenshot("live-app-sign-transaction-output.png");
  });
});
