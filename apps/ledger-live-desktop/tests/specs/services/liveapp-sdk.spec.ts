import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { DiscoverPage } from "../../models/DiscoverPage";
import { Layout } from "../../models/Layout";
import { Drawer } from "../../models/Drawer";
import { Modal } from "../../models/Modal";
import { DeviceAction } from "../../models/DeviceAction";
import { LiveAppWebview } from "../../models/LiveAppWebview";

test.use({ userdata: "1AccountBTC1AccountETH" });

let testServerIsRunning = false;

test.beforeAll(async () => {
  // Check that dummy app in libs/test-utils/dummy-live-app has been started successfully
  testServerIsRunning = await LiveAppWebview.startLiveApp("dummy-live-app/build", {
    name: "Dummy Live App",
    id: "dummy-live-app",
    permissions: [{ method: "*" }],
  });

  if (!testServerIsRunning) {
    console.warn("Stopping Live SDK test setup");
    return;
  }
});

test.afterAll(async () => {
  if (testServerIsRunning) {
    await LiveAppWebview.stopLiveApp();
  }
});

test("Live App SDK methods @smoke", async ({ page }) => {
  if (!testServerIsRunning) {
    console.warn("Test server not running - Cancelling Live SDK E2E test");
    return;
  }

  const discoverPage = new DiscoverPage(page);
  const liveAppWebview = new LiveAppWebview(page);
  const drawer = new Drawer(page);
  const modal = new Modal(page);
  const layout = new Layout(page);
  const deviceAction = new DeviceAction(page);

  await test.step("Navigate to dummy live app", async () => {
    await layout.goToDiscover();
    await discoverPage.openTestApp();
    await drawer.continue();
    await drawer.waitForDrawerToDisappear(); // macos runner was having screenshot issues here because the drawer wasn't disappearing fast enough
    await liveAppWebview.waitForCorrectTextInWebview("Ledger Live Dummy Test App");
  });

  await test.step("List all accounts", async () => {
    await liveAppWebview.getAccountsList();
    await liveAppWebview.waitForCorrectTextInWebview("mock:1:bitcoin:true_bitcoin_0:");
    await liveAppWebview.waitForCorrectTextInWebview("mock:1:bitcoin:true_bitcoin_1:");
  });

  await test.step("Request Account drawer - open", async () => {
    await liveAppWebview.requestAsset();
    await drawer.verifyAssetIsReady();
    await expect(liveAppWebview.selectAssetTitle).toBeVisible();
  });

  await test.step("Request Account - select asset", async () => {
    await drawer.selectCurrency("Bitcoin");
    await expect(liveAppWebview.selectAccountTitle).toBeVisible();
    await expect(liveAppWebview.selectAssetSearchBar).toBeEnabled();
  });

  await test.step("Request Account - select BTC", async () => {
    await drawer.selectAccount("Bitcoin", 0);
    await drawer.waitForDrawerToDisappear();
    await liveAppWebview.waitForCorrectTextInWebview("mock:1:bitcoin:true_bitcoin_0:");
  });

  await test.step("List currencies", async () => {
    await liveAppWebview.listCurrencies();
    await liveAppWebview.waitForCorrectTextInWebview("CryptoCurrency");
  });

  await test.step("Verify Address - modal", async () => {
    await liveAppWebview.verifyAddress();
    await deviceAction.openApp();
    await expect.soft(page).toHaveScreenshot("live-app-verify-address.png");
  });

  await test.step("Verify Address - address output", async () => {
    await modal.waitForModalToDisappear();
    await liveAppWebview.waitForCorrectTextInWebview("1xey");
  });

  await test.step("Sign Transaction - info modal", async () => {
    await liveAppWebview.signTransaction();
    await expect.soft(page).toHaveScreenshot("live-app-sign-transaction-info.png", {
      timeout: 20000,
    });
  });

  await test.step("Sign Transaction - confirmation modal", async () => {
    await modal.continueToSignTransaction();
    await layout.waitForLoadingSpinnerToHaveDisappeared();
    await modal.waitForConfirmationScreenToBeDisplayed();
    await expect(page.locator("text=0.0000123")).toBeVisible();
    await expect(page.locator("text=0.0000025")).toBeVisible();
    // This screenshot is flaky as the loading spinner appears again after this confirm modal, and on slow CI runners the screenshot can take a picture of this instead of the confirm.
    // await expect.soft(page).toHaveScreenshot("live-app-sign-transaction-confirm.png");
  });

  await test.step("Sign Transaction - signature output", async () => {
    await modal.waitForModalToDisappear();
    await liveAppWebview.waitForCorrectTextInWebview("mock_op_100_mock:1:bitcoin:true_bitcoin_0:");
  });
});
