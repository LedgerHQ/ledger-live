import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { DiscoverPage } from "../../page/discover.page";
import { Layout } from "../../component/layout.component";

import { Drawer } from "../../component/drawer.component";
import { Modal } from "../../component/modal.component";
import { DeviceAction } from "../../models/DeviceAction";
import { LiveAppWebview } from "../../models/LiveAppWebview";

test.use({
  userdata: "1AccountBTC1AccountETH1AccountPOLYGON",
  featureFlags: {
    lldModularDrawer: {
      enabled: false,
      params: {
        add_account: false,
        live_app: false,
        receive_flow: false,
        send_flow: false,
        enableModularization: false,
      },
    },
  },
});

let testServerIsRunning = false;

test.describe("Local Test Dapp", () => {
  test.beforeAll(async () => {
    testServerIsRunning = await LiveAppWebview.startLiveApp("dummy-dapp", {
      id: "dummy-live-app",
      name: "Local Test Dapp",
      apiVersion: "2.0.0",
      homepageUrl: "http://localhost",
      dapp: {
        provider: "evm",
        nanoApp: "Ethereum",
        networks: [
          {
            currency: "ethereum",
            chainID: 1,
          },
        ],
      },
      currencies: ["ethereum"],
      content: {
        shortDescription: {
          en: "Local dapp used by Playwright",
        },
        description: {
          en: "Local dapp used to test Ledger Live dapp browser methods",
        },
      },
      permissions: [],
      domains: ["http://"],
    });

    if (!testServerIsRunning) {
      console.warn("Stopping dapp browser test setup");
    }
  });

  test.afterAll(async () => {
    if (testServerIsRunning) {
      await LiveAppWebview.stopLiveApp();
    }
  });

  test("Dapp Browser methods @smoke", async ({ page, electronApp }) => {
    if (!testServerIsRunning) {
      console.warn("Test server not running - Cancelling dapp browser E2E test");
      return;
    }

    const discoverPage = new DiscoverPage(page);
    const drawer = new Drawer(page);
    const modal = new Modal(page);
    const layout = new Layout(page);
    const deviceAction = new DeviceAction(page);

    await layout.goToDiscover();
    await discoverPage.openTestApp();
    await drawer.continue();
    await page.getByTestId("drawer-continue-button").waitFor({ state: "detached" });

    await drawer.waitForDrawerToBeVisible();
    await expect(drawer.selectAccountTitle).toBeVisible();
    await drawer.selectAccount("Ethereum", 0);
    await drawer.waitForDrawerToDisappear();

    // Wait for webview window - React 19's concurrent rendering may delay its creation
    const windows = electronApp.windows();
    const webview =
      windows.length > 1
        ? windows[1]
        : await electronApp.waitForEvent("window", { timeout: 30000 });
    await webview.waitForLoadState("domcontentloaded", { timeout: 30000 });

    // Checks that we support EIP 6963
    await webview.click("#provider > button");

    await expect(webview.getByText("Name: Ledger Live")).toBeVisible();
    await expect(webview.getByText("Network: 1")).toBeVisible();
    await expect(webview.getByText("ChainId: 0x1")).toBeVisible();
    await expect(
      webview.getByText("Accounts: 0x6EB963EFD0FEF7A4CFAB6CE6F1421C3279D11707"),
    ).toBeVisible();

    // Checks that getAccounts returns the correct account
    await webview.click("#getAccounts");

    await expect(
      webview.getByText("eth_accounts result: 0x6EB963EFD0FEF7A4CFAB6CE6F1421C3279D11707"),
    ).toBeVisible();

    // Checks that personalSign works
    await webview.click("#personalSign");
    await expect(page.getByText("Sign message")).toBeVisible();
    await modal.continueToSignTransaction();

    // Step Device
    await deviceAction.silentSign();
    // Needs a second sign to close the sign message modal (to fix later)
    await deviceAction.silentSign();

    // Doesn't seem to wait correctly for the modal to disappear as we can still comment the line above and works
    await modal.waitForModalToDisappear();

    // Improve the deviceAction mocking to return a result in the webview to test
    // await webview.getByText("Result:");

    // You can uncomment this to make sure visually that it ends correctly
    // await page.waitForTimeout(10000);
  });
});
