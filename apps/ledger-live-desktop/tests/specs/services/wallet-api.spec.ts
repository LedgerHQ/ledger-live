import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { DiscoverPage } from "../../models/DiscoverPage";
import { Layout } from "../../models/Layout";
import { Drawer } from "../../models/Drawer";
import { Modal } from "../../models/Modal";
import { DeviceAction } from "../../models/DeviceAction";
import * as server from "../../utils/serve-dummy-app";
import { randomUUID } from "crypto";

test.use({ userdata: "1AccountBTC1AccountETH" });

let continueTest = false;

test.beforeAll(async ({ request }) => {
  // Check that dummy app in tests/utils/dummy-app-build has been started successfully
  try {
    const port = await server.start("dummy-wallet-app/build");
    const url = `http://localhost:${port}`;
    const response = await request.get(url);
    if (response.ok()) {
      continueTest = true;
      console.info(
        `========> Dummy Wallet API app successfully running on port ${port}! <=========`,
      );
      process.env.MOCK_REMOTE_LIVE_MANIFEST = JSON.stringify(
        server.liveAppManifest({
          id: "dummy-live-app",
          url,
          name: "Dummy Wallet API Live App",
          apiVersion: "2.0.0",
          content: {
            shortDescription: {
              en: "App to test the Wallet API",
            },
            description: {
              en: "App to test the Wallet API with Playwright",
            },
          },
        }),
      );
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
  console.info(`========> Dummy Wallet API app stopped <=========`);
  delete process.env.MOCK_REMOTE_LIVE_MANIFEST;
});

test("Wallet API methods", async ({ page }) => {
  if (!continueTest) return;

  const discoverPage = new DiscoverPage(page);
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
    const resPromise = discoverPage.send({
      jsonrpc: "2.0",
      id,
      method: "account.request",
      params: {
        currencyIds: ["ethereum", "bitcoin"],
      },
    });

    await drawer.selectCurrency("bitcoin");
    await drawer.selectAccount("bitcoin");

    const res = await resPromise;

    expect(res).toStrictEqual({
      jsonrpc: "2.0",
      id,
      result: {
        rawAccount: {
          id: "2d23ca2a-069e-579f-b13d-05bc706c7583",
          address: "1xeyL26EKAAR3pStd7wEveajk4MQcrYezeJ",
          balance: "35688397",
          blockHeight: 194870,
          currency: "bitcoin",
          lastSyncDate: "2020-03-14T13:34:42.000Z",
          name: "Bitcoin 1 (legacy)",
          spendableBalance: "35688397",
        },
      },
    });
  });

  await test.step("account.receive", async () => {
    const id = randomUUID();
    const resPromise = discoverPage.send({
      jsonrpc: "2.0",
      id,
      method: "account.receive",
      params: {
        accountId: "2d23ca2a-069e-579f-b13d-05bc706c7583",
      },
    });

    await deviceAction.openApp();
    await modal.waitForModalToDisappear();

    const res = await resPromise;

    expect(res).toStrictEqual({
      jsonrpc: "2.0",
      id,
      result: {
        address: "1xeyL26EKAAR3pStd7wEveajk4MQcrYezeJ",
      },
    });
  });
});
