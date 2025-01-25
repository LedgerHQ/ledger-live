import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { DiscoverPage } from "../../page/discover.page";
import { Layout } from "../../component/layout.component";
import { Drawer } from "../../component/drawer.component";
import { Modal } from "../../component/modal.component";
import { DeviceAction } from "../../models/DeviceAction";
import { LiveAppWebview } from "../../models/LiveAppWebview";

test.use({ userdata: "1AccountBTC1AccountETH" });

let testServerIsRunning = false;

test.beforeAll(async () => {
  // Check that dummy app in tests/dummy-live-app has been started successfully
  testServerIsRunning = await LiveAppWebview.startLiveApp("dummy-live-app/build", {
    name: "Dummy Live App",
    id: "dummy-live-app",
    permissions: [],
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
    await expect(drawer.selectAssetTitle).toBeVisible();
  });

  await test.step("Request Account - select asset", async () => {
    await drawer.selectCurrency("Bitcoin");
    await expect(drawer.selectAccountTitle).toBeVisible();
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
    // Dummy test app behaves differently between runners (external e2e vs usual), we only want to test the modal here
    await expect.soft(modal.container).toHaveScreenshot("live-app-verify-address.png");
  });

  await test.step("Verify Address - address output", async () => {
    await deviceAction.complete();
    await modal.waitForModalToDisappear();
    await liveAppWebview.waitForCorrectTextInWebview("1xey");
  });

  /**
   * START OF SIGN BITCOIN TRANSACTION TESTS
   */

  /**
   * This test is flaky, so disabling for now.
   * Sometimes the transaction amount is simply 0 with no fees
   */
  /*
  await test.step("Sign bitcoin Transaction - info modal", async () => {
    await liveAppWebview.signBitcoinTransaction();
    await expect.soft(page).toHaveScreenshot("live-app-sign-bitcoin-transaction-info.png", {
      timeout: 20000,
    });
  });

  await test.step("Sign bitcoin Transaction - confirmation modal", async () => {
    await modal.continueToSignTransaction();
    await layout.waitForLoadingSpinnerToHaveDisappeared();
    await modal.waitForConfirmationScreenToBeDisplayed();
    await expect(page.locator("text=0.0000123")).toBeVisible();
    await expect(page.locator("text=0.0000025")).toBeVisible();
    // This screenshot is flaky as the loading spinner appears again after this confirm modal, and on slow CI runners the screenshot can take a picture of this instead of the confirm.
    // await expect.soft(page).toHaveScreenshot("live-app-sign-transaction-confirm.png");
  });

  await test.step("Sign bitcoin Transaction - signature output", async () => {
    await modal.waitForModalToDisappear();
    await liveAppWebview.waitForCorrectTextInWebview("mock_op_100_mock:1:bitcoin:true_bitcoin_0:");
  });
  */

  /**
   * END OF SIGN BITCOIN TRANSACTION TESTS
   */

  /**
   * This test is flaky, so disabling for now.
   * Furthermore, this is testing deprecated features (live-app-sdk and legacy ethereum tx)
   * This whole testsuite should be reworked to be more consistent with actual behaviour and to test wallet-api
   * Also, what are we actually testing here and are we using the right tools to do so?
   * If we want to test the interaction with live-app-sdk (or wallet-api) it should rather be tested as parto of
   * the libs/ledger-live-common/src/platform logic (or libs/ledger-live-common/src/wallet-api respecitvely)
   * If we want to test the flow logic and / or UI consistency, it could be tested using React Testing Library
   * (https://testing-library.com/docs/react-testing-library/intro/) and / or jest snapshot testing (https://jestjs.io/docs/snapshot-testing)
   */
  /**
   * START OF SIGN ETHEREUM TRANSACTION TESTS
   */
  // await test.step("Sign ethereum Transaction - info modal", async () => {
  //   await liveAppWebview.signEthereumTransaction();
  //   await expect.soft(page).toHaveScreenshot("live-app-sign-ethereum-transaction-info.png", {
  //     timeout: 20000,
  //   });
  // });

  // await test.step("Sign ethereum Transaction - confirmation modal", async () => {
  //   await modal.continueToSignTransaction();
  //   await layout.waitForLoadingSpinnerToHaveDisappeared();
  //   await modal.waitForConfirmationScreenToBeDisplayed();
  //   await expect(page.locator("text=0.00000000000000123")).toBeVisible();
  //   // This screenshot is flaky as the loading spinner appears again after this confirm modal, and on slow CI runners the screenshot can take a picture of this instead of the confirm.
  //   // await expect.soft(page).toHaveScreenshot("live-app-sign-transaction-confirm.png");
  // });

  // await test.step("Sign ethereum Transaction - signature output", async () => {
  //   await modal.waitForModalToDisappear();
  //   await liveAppWebview.waitForCorrectTextInWebview(
  //     "mock_op_100_mock:1:ethereum:true_ethereum_0:",
  //   );
  // });
  /**
   * END OF SIGN ETHEREUM TRANSACTION TESTS
   */
});
