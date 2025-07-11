import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Modal } from "../../component/modal.component";
import { DiscoverPage } from "../../page/discover.page";
import { Layout } from "../../component/layout.component";
import { Drawer } from "../../component/drawer.component";
import { DeviceAction } from "../../models/DeviceAction";
import { LiveAppWebview } from "../../models/LiveAppWebview";

const methods = [
  "account.request",
  "account.receive",
  "message.sign",
  "storage.get",
  "storage.set",
  "transaction.sign",
  "transaction.signAndBroadcast",
  "device.transport",
  "device.select",
  "device.open",
  "device.exchange",
  "device.close",
  "bitcoin.getXPub",
  "exchange.start",
  "exchange.complete",
  "account.list",
  "currency.list",
  "wallet.capabilities",
  "wallet.info",
  "wallet.userId",
];

test.use({ userdata: "1AccountBTC1AccountETH" });

let testServerIsRunning = false;
const MANIFEST_NAME = "Dummy Wallet API Live App";

test.beforeAll(async () => {
  // Check that dummy app in tests/dummy-live-app has been started successfully
  testServerIsRunning = await LiveAppWebview.startLiveApp("dummy-wallet-app/dist", {
    name: MANIFEST_NAME,
    id: "dummy-live-app",
    apiVersion: "2.0.0",
    content: {
      shortDescription: {
        en: "App to test the Wallet API",
      },
      description: {
        en: "App to test the Wallet API with Playwright",
      },
    },
    permissions: methods,
  });

  if (!testServerIsRunning) {
    console.warn("Stopping Buy/Sell test setup");
    return;
  }
});

test.afterAll(async () => {
  if (testServerIsRunning) {
    await LiveAppWebview.stopLiveApp();
  }
});

test("Confirm Transaction modals @smoke", async ({ page, electronApp }) => {
  const discoverPage = new DiscoverPage(page);
  const drawer = new Drawer(page);
  const layout = new Layout(page);

  if (!testServerIsRunning) {
    console.warn("Test server not running - Cancelling confirm transaction E2E test");
    return;
  }

  const liveAppWebview = new LiveAppWebview(page, electronApp);
  await liveAppWebview.waitForLoaded();
  const modal = new Modal(page);
  const deviceAction = new DeviceAction(page);

  await layout.goToDiscover();
  await discoverPage.openTestApp();
  await drawer.continue();
  await drawer.waitForDrawerToDisappear();

  await test.step("transaction.signAndBroadcast", async () => {
    // We need to click on a button to have the fill work correctly
    await liveAppWebview.clearStates();

    const recipient = "0x046615F0862392BC5E6FB43C92AAD73DE158D235";
    const amount = "100000000000000"; // 0.0001 ETH in wei
    const data = "SomeDataInHex";

    await liveAppWebview.setAccountId("e86e3bc1-49e1-53fd-a329-96ba6f1b06d3");
    await liveAppWebview.setRecipient(recipient);
    await liveAppWebview.setAmount(amount);
    await liveAppWebview.setData(data);
    await liveAppWebview.transactionSignAndBroadcast();

    // Step Fees
    await expect(page.getByText(/learn more about fees/i)).toBeVisible();
    await modal.continueToSignTransaction();

    // Step Recipient
    await expect(page.getByText(recipient)).toBeVisible();
    await modal.continueToSignTransaction();

    // Step Device
    await page.waitForTimeout(2500);
    await deviceAction.openApp();
    await expect(page.getByText("Sign transaction on your Ledger Device")).toBeVisible();
    await expect(page.getByText("0.0001 ETH")).toBeVisible();
    await expect(
      page.getByText("Double-check the transaction details on your Ledger device before signing."),
    ).toBeVisible();

    // Displays TOC in footer
    const operationList = page.getByTestId("confirm-footer-toc");
    await operationList.scrollIntoViewIfNeeded();
    await expect(page.getByText(`${MANIFEST_NAME}'s terms of use.`)).toBeVisible();

    const res = await liveAppWebview.getResOutput();
    expect(res).toBe("32BEBB4660C4C328F7E130D0E1F45D5B2AFD9129B903E0F3B6EA52756329CD25");

    await liveAppWebview.clearStates();
  });

  await test.step("transaction.signAndBroadcast approval screen, unlimited", async () => {
    const recipient = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const amount = "0"; // Approve unlimited amount
    const data =
      // approve(address spender, uint256 wad)
      "095ea7b3" +
      // spender (address)
      "0000000000000000000000000444444ba9f3e719726886d34a177484278bfcae" +
      // wad (unlimited)
      "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

    await liveAppWebview.setAccountId("e86e3bc1-49e1-53fd-a329-96ba6f1b06d3");
    await liveAppWebview.setRecipient(recipient);
    await liveAppWebview.setAmount(amount);
    await liveAppWebview.setData(data);
    await liveAppWebview.transactionSignAndBroadcast();

    // Step Fees
    await expect(page.getByText(/learn more about fees/i)).toBeVisible();
    await expect(page.getByText("Approve token")).toBeVisible();
    await modal.continueToSignTransaction();

    // Step Recipient
    await expect(page.getByText(recipient)).toBeVisible();
    await modal.continueToSignTransaction();

    // Step Device
    await page.waitForTimeout(2500);
    await deviceAction.openApp();
    await expect(page.getByText("Approve token on your ledger device")).toBeVisible();
    await expect(page.getByText("Unlimited WETH")).toBeVisible();
    await expect(
      page.getByText(
        "You're authorizing this provider to access an unlimited amount of the selected token from your wallet",
      ),
    ).toBeVisible();

    // Displays TOC in footer
    const operationList = page.getByTestId("confirm-footer-toc");
    await operationList.scrollIntoViewIfNeeded();
    await expect(page.getByText(`${MANIFEST_NAME}'s terms of use.`)).toBeVisible();

    const res = await liveAppWebview.getResOutput();
    expect(res).toBe("32BEBB4660C4C328F7E130D0E1F45D5B2AFD9129B903E0F3B6EA52756329CD25");

    await liveAppWebview.clearStates();
  });

  await test.step("transaction.signAndBroadcast approval screen, limited", async () => {
    const recipient = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const amount = "0"; // Approve limited amount
    const data =
      // approve(address spender, uint256 wad)
      "095ea7b3" +
      // spender (address)
      "0000000000000000000000000444444ba9f3e719726886d34a177484278bfcae" +
      // wad, limited (uint256 = 6000000000000000)
      "000000000000000000000000000000000000000000000000001550f7dca70000";

    await liveAppWebview.setAccountId("e86e3bc1-49e1-53fd-a329-96ba6f1b06d3");
    await liveAppWebview.setRecipient(recipient);
    await liveAppWebview.setAmount(amount);
    await liveAppWebview.setData(data);
    await liveAppWebview.transactionSignAndBroadcast();

    // Step Fees
    await expect(page.getByText(/learn more about fees/i)).toBeVisible();
    await expect(page.getByText("Approve token")).toBeVisible();
    await modal.continueToSignTransaction();

    // Step Recipient
    await expect(page.getByText(recipient)).toBeVisible();
    await modal.continueToSignTransaction();

    // Step Device
    await page.waitForTimeout(2500);
    await deviceAction.openApp();
    await expect(page.getByText("Approve token on your ledger device")).toBeVisible();
    await expect(page.getByText("WETH 0.006")).toBeVisible();
    await expect(
      page.getByText(
        "You're authorizing this provider to access the selected token from your wallet",
      ),
    ).toBeVisible();

    const res = await liveAppWebview.getResOutput();
    expect(res).toBe("32BEBB4660C4C328F7E130D0E1F45D5B2AFD9129B903E0F3B6EA52756329CD25");

    await liveAppWebview.clearStates();
  });
});
