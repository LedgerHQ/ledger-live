/**
 * Smallest end-to-end demo:
 *   1. Launch the app + open the bridge socket.
 *   2. Stream the "skip-onboarding" userdata so we land on the wallet screen.
 *   3. Assert the wallet root is up — via the WalletPage object.
 */
import { launchApp, closeApp } from "../helpers/launchApp";
import { loadConfig } from "../helpers/loadConfig";
import { app } from "../pages";

describe("Starter", () => {
  beforeAll(async () => {
    await launchApp();
    await loadConfig("skip-onboarding");
  });

  afterAll(() => {
    closeApp();
  });

  it("boots into a seeded wallet", async () => {
    await app.wallet.expectReady();
  });
});
