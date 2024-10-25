import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { DiscoverPage } from "../../page/discover.page";
import { Layout } from "../../component/layout.component";
import { WebviewLayout } from "../../component/webviewLayout.component";

import { Drawer } from "../../component/drawer.component";
import { Modal } from "../../component/modal.component";
import { DeviceAction } from "../../models/DeviceAction";
import dummyLiveApp from "./dapp.spec.ts-mocks/dummy-live-app";
import dummy1inchLiveApp from "./dapp.spec.ts-mocks/1inch-live-app";

test.use({ userdata: "1AccountBTC1AccountETH1AccountPOLYGON" });

test.describe("Metamask Test Dapp", () => {
  test.beforeAll(async () => {
    process.env.MOCK_REMOTE_LIVE_MANIFEST = dummyLiveApp;
  });

  test("Dapp Browser methods @smoke", async ({ page, electronApp }) => {
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

test.describe.skip("1inch dapp", () => {
  test.beforeAll(async () => {
    process.env.MOCK_REMOTE_LIVE_MANIFEST = dummy1inchLiveApp;
  });

  test("Dapp switch chain", async ({ page, electronApp }) => {
    const discoverPage = new DiscoverPage(page);
    const drawer = new Drawer(page);
    const layout = new Layout(page);
    const webviewLayout = new WebviewLayout(page);

    await layout.goToDiscover();
    await discoverPage.openTestApp();
    await drawer.continue();
    await drawer.waitForDrawerToDisappear();

    const [, webview] = electronApp.windows();
    const restricted_app = await webview.getByText("Restricted").isVisible();
    test.skip(restricted_app, "1inch dapp is restricted");

    const popup = webview.locator(".cross-icon");
    await webview.getByRole("button", { name: "Connect wallet", exact: true }).click();
    if (await popup.isVisible()) await popup.click();
    await webview.locator(".connect-wallet__box > button").click();
    await webview.getByRole("button", { name: "Connect wallet", exact: true }).click();
    await webview.getByRole("button", { name: "Ledger Live Ledger Live" }).click();
    await page.getByText("Ethereum 110.1354 ETH").click();
    await webview.getByRole("button", { name: "Ethereum" }).click();
    await webview.getByRole("button", { name: "Polygon" }).click();
    await page.getByText("Polygon").click();
    await expect(webviewLayout.selectedAccountButton).toHaveText("Polygon 1");
  });
});
