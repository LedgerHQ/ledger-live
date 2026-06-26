import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { DiscoverPage } from "../../page/discover.page";
import { Layout } from "../../component/layout.component";
import { Drawer } from "../../component/drawer.component";
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

// Regression test for dapps shipping a strict Content-Security-Policy.
//
// The dummy dapp is served with `script-src 'self'`, which forbids inline
// scripts. Its own logic is loaded from a same-origin file (dapp.js) so it
// stays allowed, isolating what the policy actually exercises: Ledger Live's
// injected Ethereum provider.
//
// With the previous implementation (an inline <script> appended to the DOM)
// the provider is blocked by this CSP and never attaches, so EIP-6963
// announcement never fires and the provider button reports "Provider not
// found" - this test fails. Evaluating the provider via
// `webFrame.executeJavaScript` bypasses the page CSP, so it keeps working and
// this test passes.
test.describe("Local Test Dapp with strict CSP", () => {
  test.beforeAll(async () => {
    testServerIsRunning = await LiveAppWebview.startLiveApp(
      "dummy-dapp",
      {
        id: "dummy-live-app",
        name: "Local Test Dapp CSP",
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
            en: "Local dapp used to test Ledger Live dapp browser methods under a strict CSP",
          },
        },
        permissions: [],
        domains: ["http://"],
      },
      { csp: "script-src 'self'" },
    );

    if (!testServerIsRunning) {
      throw new Error("Dummy dapp server failed to start");
    }
  });

  test.afterAll(async () => {
    if (testServerIsRunning) {
      await LiveAppWebview.stopLiveApp();
    }
  });

  test("injected provider survives a strict script-src CSP @smoke", async ({
    page,
    electronApp,
  }) => {
    const discoverPage = new DiscoverPage(page);
    const drawer = new Drawer(page);
    const layout = new Layout(page);

    await layout.goToDiscover();
    await discoverPage.openTestApp();
    await drawer.continue();
    await page.getByTestId("drawer-continue-button").waitFor({ state: "detached" });

    await drawer.waitForAccountSelectionStep();
    await drawer.selectAccount("Ethereum 1");
    await drawer.waitForDrawerToDisappear();

    // Wait for webview window - React 19's concurrent rendering may delay its creation
    const windows = electronApp.windows();
    const webview =
      windows.length > 1
        ? windows[1]
        : await electronApp.waitForEvent("window", { timeout: 30000 });
    await webview.waitForLoadState("domcontentloaded", { timeout: 30000 });

    // EIP-6963 announcement + eth_chainId / eth_accounts all rely on the
    // injected provider being present in the page's main world. Under the
    // strict CSP this only succeeds if the provider was injected in a way the
    // CSP does not block.
    await webview.click("#provider > button");

    await expect(webview.getByText("Name: Ledger Live")).toBeVisible();
    await expect(webview.getByText("Network: 1")).toBeVisible();
    await expect(webview.getByText("ChainId: 0x1")).toBeVisible();
    await expect(
      webview.getByText("Accounts: 0x6EB963EFD0FEF7A4CFAB6CE6F1421C3279D11707"),
    ).toBeVisible();
    await expect(webview.getByText("Provider not found")).toBeHidden();
  });
});
