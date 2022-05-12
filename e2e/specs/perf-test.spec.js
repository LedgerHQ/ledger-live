import { loadConfig } from "../bridge/server";
import { delay, retryAction } from "../helpers";

const { device, element, by, waitFor } = require("detox");

describe.skip("Navigation while syncing - performance test", () => {
  beforeAll(async () => {
    await device.launchApp({
      delete: true,
      launchArgs: {
        detoxURLBlacklistRegex: ".*://explorers.api.live.ledger.com/.*",
      },
    });
  });

  it.skip("should import accounts", async () => {
    const initialTime = Date.now();
    await device.disableSynchronization();

    await retryAction(async () => {
      await loadConfig("allLiveCoinsNoOperations", true);
    });

    await retryAction(async () => {
      const accountTabButton = element(by.id("TabBarAccounts"));
      await waitFor(accountTabButton).toBeVisible();
      await delay(1000);
      await accountTabButton.tap();
    });

    await retryAction(async () => {
      const firstAccountButton = element(by.text("Komodo 1"));
      await waitFor(firstAccountButton).toBeVisible();
      await firstAccountButton.tap();
    });

    await device.enableSynchronization();

    // eslint-disable-next-line no-console
    console.log(
      `Test finished, took ${(Date.now() - initialTime) / 1000}s to execute`,
    );
  });
});
