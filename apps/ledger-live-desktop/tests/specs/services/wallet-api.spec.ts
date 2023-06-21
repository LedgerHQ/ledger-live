import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { DiscoverPage } from "../../models/DiscoverPage";
import { Layout } from "../../models/Layout";
import { Drawer } from "../../models/Drawer";
// import { Modal } from "../../models/Modal";
// import { DeviceAction } from "../../models/DeviceAction";
import * as server from "../../utils/serve-dummy-app";
import { randomUUID } from "crypto";

test.use({ userdata: "1AccountBTC1AccountETH" });

let continueTest = false;

test.beforeAll(async ({ request }) => {
  // Check that dummy app in tests/utils/dummy-app-build has been started successfully
  try {
    // const port = await server.start("dummy-live-app/build");
    const port = 3000;
    const url = `http://localhost:${port}`;
    const response = await request.get(url);
    if (response.ok()) {
      continueTest = true;
      console.info(`========> Dummy test app successfully running on port ${port}! <=========`);
      process.env.MOCK_REMOTE_LIVE_MANIFEST = JSON.stringify(server.dummyLiveAppManifest(url));
    } else {
      throw new Error("Ping response != 200, got: " + response.status);
    }
  } catch (error) {
    console.warn(`========> Dummy test app not running! <=========`);
    console.error(error);
  }
});

test.afterAll(() => {
  delete process.env.MOCK_REMOTE_LIVE_MANIFEST;
});

test("Wallet API methods", async ({ page }) => {
  if (!continueTest) return;

  const discoverPage = new DiscoverPage(page);
  const drawer = new Drawer(page);
  // const modal = new Modal(page);
  const layout = new Layout(page);
  // const deviceAction = new DeviceAction(page);

  await test.step("account.request", async () => {
    await layout.goToDiscover();
    await discoverPage.openTestApp();
    await drawer.continue();
    await drawer.waitForDrawerToDisappear(); // macos runner was having screenshot issues here because the drawer wasn't disappearing fast enough

    const id = randomUUID();
    const res = await discoverPage.send({
      jsonrpc: "2.0",
      id,
      method: "account.request",
      params: {
        currencyIds: ["ethereum", "bitcoin"],
      },
    });

    // TODO: Select account on LL CC @ggilchrist-ledger

    // await page.pause();

    expect(res).toBe({
      jsonrpc: "2.0",
      id,
    });
  });
});
