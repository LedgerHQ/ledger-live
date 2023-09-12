import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { DiscoverPage } from "../../models/DiscoverPage";
import { Layout } from "../../models/Layout";
import { Drawer } from "../../models/Drawer";
import { Modal } from "../../models/Modal";
import { DeviceAction } from "../../models/DeviceAction";
import { randomUUID } from "crypto";
import { LiveAppWebview } from "../../models/LiveAppWebview";
import {
  account_list as account_list_mock,
  account_receive as account_receive_mock,
  account_request as account_request_mock,
  bitcoin_xPub as bitcoin_xPub_mock,
  currency_list as currency_list_mock,
  transaction_sign as transaction_sign_mock,
  transaction_signAndBroadcast as transaction_signAndBroadcast_mock,
  wallet_capabilities as wallet_capabilities_mock,
  wallet_info as wallet_info_mock,
  wallet_userId as wallet_userId_mock,
} from "./mocks.wallet-api";
import BigNumber from "bignumber.js";

test.use({ userdata: "1AccountBTC1AccountETH" });

let testServerIsRunning = false;

test.beforeAll(async () => {
  // Check that dummy app in libs/test-utils/dummy-live-app has been started successfully
  testServerIsRunning = await LiveAppWebview.startLiveApp("dummy-wallet-app/build", {
    name: "Dummy Wallet API Live App",
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
    permissions: [
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
    ],
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

test("Wallet API methods @smoke", async ({ page }) => {
  if (!testServerIsRunning) {
    console.warn("Test server not running - Cancelling Wallet API E2E test");
    return;
  }

  const discoverPage = new DiscoverPage(page);
  const liveAppWebview = new LiveAppWebview(page);
  const drawer = new Drawer(page);
  const modal = new Modal(page);
  const layout = new Layout(page);
  const deviceAction = new DeviceAction(page);

  await test.step("account.request", async () => {
    await layout.goToDiscover();
    await discoverPage.openTestApp();
    await drawer.continue();
    await drawer.waitForDrawerToDisappear();

    const id = randomUUID();
    const response = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "account.request",
      params: {
        currencyIds: ["ethereum", "bitcoin"],
      },
    });

    await drawer.selectCurrency("bitcoin");
    await drawer.selectAccount("bitcoin");

    await expect(response).resolves.toMatchObject({ id, ...account_request_mock });
  });

  await test.step("account.receive", async () => {
    const id = randomUUID();
    const response = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "account.receive",
      params: {
        accountId: "2d23ca2a-069e-579f-b13d-05bc706c7583",
      },
    });

    await deviceAction.openApp();
    await modal.waitForModalToDisappear();
    await expect(response).resolves.toStrictEqual({ id, ...account_receive_mock });
  });

  await test.step("account.list", async () => {
    const id = randomUUID();
    const response = await liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "account.list",
    });

    const responseFiltred = {
      id,
      rawAccounts: response.result.rawAccounts.map(
        ({ lastSyncDate, ...rest }: { lastSyncDate: Date; rest: unknown }) => rest,
      ),
    };

    await expect(responseFiltred).toStrictEqual({
      id,
      ...account_list_mock,
    });
  });

  await test.step("bitcoin.getXPub", async () => {
    const id = randomUUID();
    const response = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "bitcoin.getXPub",
      params: {
        accountId: "3463fc5b-deb9-5b19-a27e-4554624f2090",
      },
    });

    await expect(response).resolves.toStrictEqual({ id, ...bitcoin_xPub_mock });
  });

  await test.step("currency.list", async () => {
    const id = randomUUID();
    const response = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "currency.list",
    });

    await expect(response).resolves.toStrictEqual({ id, ...currency_list_mock });
  });

  await test.step("storage", async () => {
    const id = randomUUID();
    const value = randomUUID();

    const responseSet = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "storage.set",
      params: {
        key: "testKey",
        value,
      },
    });

    await expect(responseSet).resolves.toStrictEqual({ jsonrpc: "2.0", id });

    const responseGet = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "storage.get",
      params: {
        key: "testKey",
      },
    });

    await expect(responseGet).resolves.toStrictEqual({
      jsonrpc: "2.0",
      id,
      result: { value },
    });
  });

  await test.step("transaction.sign", async () => {
    const id = randomUUID();

    const response = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "transaction.sign",
      params: {
        //ETH Account
        accountId: "e86e3bc1-49e1-53fd-a329-96ba6f1b06d3",
        rawTransaction: {
          family: "ethereum",
          amount: new BigNumber(100000000000000),
          recipient: "0x046615F0862392BC5E6FB43C92AAD73DE158D235",
          data: Buffer.from("SomeDataInHex").toString("hex"),
        },
      },
    });

    await modal.continueToSignTransaction();
    await modal.continueToSignTransaction();
    await deviceAction.silentSign();

    await expect(response).resolves.toStrictEqual({
      id,
      ...transaction_sign_mock,
    });
  });

  await test.step("transaction.signAndBroadcast", async () => {
    const id = randomUUID();

    const response = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "transaction.signAndBroadcast",
      params: {
        //ETH Account
        accountId: "e86e3bc1-49e1-53fd-a329-96ba6f1b06d3",
        rawTransaction: {
          family: "ethereum",
          amount: new BigNumber(100000000000000),
          recipient: "0x046615F0862392BC5E6FB43C92AAD73DE158D235",
          data: Buffer.from("SomeDataInHex").toString("hex"),
        },
      },
    });

    await modal.continueToSignTransaction();
    await modal.continueToSignTransaction();
    await deviceAction.silentSign();

    await expect(response).resolves.toStrictEqual({
      id,
      ...transaction_signAndBroadcast_mock,
    });
  });

  await test.step("wallet.capabilities", async () => {
    const id = randomUUID();

    const response = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "wallet.capabilities",
    });

    await expect(response).resolves.toStrictEqual({
      id,
      ...wallet_capabilities_mock,
    });
  });

  await test.step("wallet.userId", async () => {
    const id = randomUUID();

    const response = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "wallet.userId",
    });

    await expect(response).resolves.toStrictEqual({
      id,
      ...wallet_userId_mock,
    });
  });

  await test.step("wallet.info", async () => {
    const id = randomUUID();

    const response = liveAppWebview.send({
      jsonrpc: "2.0",
      id,
      method: "wallet.info",
    });

    await expect(response).resolves.toStrictEqual({
      id,
      ...wallet_info_mock,
    });
  });
});
