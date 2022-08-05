import { expect } from "@playwright/test";
import { DeviceAction } from "tests/models/DeviceAction";
import { Drawer } from "tests/models/Drawer";
import { Modal } from "tests/models/Modal";
import test from "../../fixtures/common";
import { DiscoverPage } from "../../models/DiscoverPage";
import { Layout } from "../../models/Layout";
import * as server from "../../utils/serve-dummy-app";

// Comment out to disable recorder
process.env.PWDEBUG = "1";

test.use({ userdata: "1AccountBTC1AccountETH", env: { DEV_TOOLS: true } });

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

  await test.step("Navigate to catalog", async () => {
    await layout.goToDiscover();
    await expect.soft(page).toHaveScreenshot("catalog.png");
  });

  await test.step("Open Test App", async () => {
    await discoverPage.openTestApp();
    await expect.soft(drawer.content).toContainText("External Application");
  });

  await test.step("Accept Live App Disclaimer", async () => {
    await drawer.continue();
    await drawer.waitForDrawerToDisappear(); // macos runner was having screenshot issues here because the drawer wasn't disappearing fast enough
    await layout.waitForLoadingSpinnerToHaveDisappeared();
    await expect.soft(page).toHaveScreenshot("live-disclaimer-accepted.png");
  });

  // To test that the navigation button in webPlatformPlayer topBar is enabled
  await test.step("Navigate in live app to about page", async () => {
    await page.pause();
    await discoverPage.navigateToAboutLink();

    /**
     * FIXME: should find an alternative to screenshot
     * find an easy way to get a webview element and perform assert on it
     * like toBeVisible() or toHaveURL(regex) for example
     */
     await page.pause();
    await expect(await discoverPage.getWebviewHeadingElementByText()).toBe("About Page");
  });

  // To test that the back navigation button in webPlatformPlayer topBar is working
  await test.step("Navigate backward in live app", async () => {
    await page.pause();
    await discoverPage.goBack();
    await page.pause();
    // await expect.soft(page).toHaveScreenshot("live-app-navigate-go-back.png");
  });

  // To test that the forward navigation button in webPlatformPlayer topBar is working
  await test.step("Navigate forward in live app", async () => {
    await discoverPage.goForward();

    await expect.soft(page).toHaveScreenshot("live-app-navigate-about-page2.png");
  });

  // To test that both navigation buttons in webPlatformPlayer topBar are enabled
  await test.step("Navigate in live app to middle of history", async () => {
    await discoverPage.clickWebviewElement("[data-test-id=dashboard-link]");
    await discoverPage.goBack();

    await expect.soft(page).toHaveScreenshot("live-app-navigate-middle-history.png");

    // Come back to home for next tests
    await discoverPage.clickWebviewElement("[data-test-id=home-link]");
  });

  await test.step("List all accounts", async () => {
    await discoverPage.getAccountsList();
    await expect.soft(page).toHaveScreenshot("live-app-list-all-accounts.png");
  });

  await test.step("Request Account drawer - open", async () => {
    await discoverPage.requestAccount();
    await expect.soft(page).toHaveScreenshot("live-app-request-account-drawer.png");
  });

  await test.step("Request Account - select asset", async () => {
    await discoverPage.selectAsset();
    await expect.soft(page).toHaveScreenshot("live-app-request-account-select-account.png");
  });

  await test.step("Request Account - select BTC", async () => {
    await discoverPage.selectAccount();
    await expect.soft(page).toHaveScreenshot("live-app-request-account-output.png");
  });

  await test.step("List currencies", async () => {
    await discoverPage.listCurrencies();
    await expect.soft(page).toHaveScreenshot("live-app-list-currencies.png");
  });

  await test.step("Verify Address - modal", async () => {
    await discoverPage.verifyAddress();
    await deviceAction.openApp();
    await expect.soft(page).toHaveScreenshot("live-app-verify-address.png");
  });

  await test.step("Verify Address - address output", async () => {
    await modal.waitForModalToDisappear();
    await expect.soft(page).toHaveScreenshot("live-app-verify-address-output.png");
  });

  await test.step("Sign Transaction - info modal", async () => {
    await discoverPage.signTransaction();
    await expect.soft(page).toHaveScreenshot("live-app-sign-transaction-info.png");
  });

  await test.step("Sign Transaction - confirmation modal", async () => {
    await discoverPage.continueToSignTransaction();
    await layout.waitForLoadingSpinnerToHaveDisappeared();
    await discoverPage.waitForConfirmationScreenToBeDisplayed();
    await expect.soft(page).toHaveScreenshot("live-app-sign-transaction-confirm.png");
  });

  await test.step("Sign Transaction - signature output", async () => {
    await modal.waitForModalToDisappear();
    await expect.soft(page).toHaveScreenshot("live-app-sign-transaction-output.png");
  });
});
