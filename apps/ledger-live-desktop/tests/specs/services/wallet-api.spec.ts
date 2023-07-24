import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { DiscoverPage } from "../../models/DiscoverPage";
import { Layout } from "../../models/Layout";
import { Drawer } from "../../models/Drawer";
import { Modal } from "../../models/Modal";
import { DeviceAction } from "../../models/DeviceAction";
import { randomUUID } from "crypto";
import { LiveAppWebview } from "../../models/LiveAppWebview";

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

    await expect(response).resolves.toMatchObject({
      jsonrpc: "2.0",
      id,
      result: {
        rawAccount: {
          id: "2d23ca2a-069e-579f-b13d-05bc706c7583",
          address: "1xeyL26EKAAR3pStd7wEveajk4MQcrYezeJ",
          balance: "35688397",
          blockHeight: 194870,
          currency: "bitcoin",
          // lastSyncDate: "2020-03-14T13:34:42.000Z", TODO: make sure the sync date doesn't change
          name: "Bitcoin 1 (legacy)",
          spendableBalance: "35688397",
        },
      },
    });
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

    await expect(response).resolves.toStrictEqual({
      jsonrpc: "2.0",
      id,
      result: {
        address: "1xeyL26EKAAR3pStd7wEveajk4MQcrYezeJ",
      },
    });
  });
});
