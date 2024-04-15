import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { DiscoverPage } from "../../models/DiscoverPage";
import { Layout } from "../../models/Layout";
import { Drawer } from "../../models/Drawer";
import { Modal } from "../../models/Modal";
import { DeviceAction } from "../../models/DeviceAction";

test.use({ userdata: "1AccountBTC1AccountETH" });

test.beforeAll(async () => {
  process.env.MOCK_REMOTE_LIVE_MANIFEST = JSON.stringify([
    {
      id: "dummy-live-app",
      name: "Metamask Test Dapp",
      private: false,
      url: "https://metamask.github.io/test-dapp/",
      dapp: {
        networks: [
          {
            currency: "ethereum",
            chainID: 1,
            nodeURL: "https://eth-dapps.api.live.ledger.com",
          },
          {
            currency: "bsc",
            chainID: 56,
            nodeURL: "https://bsc-dataseed.binance.org/",
          },
          {
            currency: "polygon",
            chainID: 137,
            nodeURL: "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE",
          },
          {
            currency: "arbitrum",
            chainID: 42161,
            nodeURL: "https://arb1.arbitrum.io/rpc",
          },
          {
            currency: "optimism",
            chainID: 10,
            nodeURL: "https://mainnet.optimism.io",
          },
        ],
      },
      homepageUrl: "https://metamask.github.io/test-dapp/",
      icon: "https://cdn.live.ledger.com/icons/platform/1inch.png",
      platforms: ["android", "ios", "desktop"],
      apiVersion: "^2.0.0",
      manifestVersion: "1",
      branch: "stable",
      categories: ["tools"],
      currencies: ["ethereum", "bsc", "polygon", "arbitrum", "optimism"],
      content: {
        shortDescription: {
          en: "Metamask Test Dapp",
        },
        description: {
          en: "Metamask Test Dapp",
        },
      },
      permissions: [],
      domains: ["http://", "https://"],
      visibility: "complete",
    },
  ]);
});

test("Wallet API methods @smoke", async ({ page, electronApp }) => {
  const discoverPage = new DiscoverPage(page);
  const drawer = new Drawer(page);
  const modal = new Modal(page);
  const layout = new Layout(page);
  const deviceAction = new DeviceAction(page);

  await layout.goToDiscover();
  await discoverPage.openTestApp();
  await drawer.continue();
  await drawer.waitForDrawerToDisappear();

  const [, webview] = electronApp.windows();

  // Checks that we support EIP 6963
  await webview.click("#provider > button");

  webview.getByText("Name: Ledger Live");
  webview.getByText("Network: 1");
  webview.getByText("ChainId: 0x1");
  webview.getByText("Accounts: 0x6EB963EFD0FEF7A4CFAB6CE6F1421C3279D11707");

  // Checks that getAccounts returns the correct account
  await webview.click("#getAccounts");

  webview.getByText("eth_accounts result: 0x6EB963EFD0FEF7A4CFAB6CE6F1421C3279D11707");

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
