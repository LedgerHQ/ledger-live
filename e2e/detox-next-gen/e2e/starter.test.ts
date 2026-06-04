/**
 * Smallest end-to-end demo:
 *   1. Launch the app + open the bridge socket.
 *   2. Stream the "skip-onboarding" userdata so we land on the wallet screen.
 *   3. Assert *something* via the Detox APIs.
 *
 * `expect` is imported from `detox` to override the global Jest `expect`
 * type (their type defs collide — this is the supported workaround).
 */
import { element, by, expect } from "detox";
import { launchApp, closeApp } from "../helpers/launchApp";
import { loadConfig } from "../helpers/loadConfig";

describe("Starter", () => {
  beforeAll(async () => {
    await launchApp();
    await loadConfig("skip-onboarding");
  });

  afterAll(() => {
    closeApp();
  });

  it("boots into a seeded wallet", async () => {
    // The "Discover" bottom-tab label is uniquely visible on the Wallet 4.0
    // root once onboarding is complete. Anchoring by text (instead of testID)
    // avoids chasing the MVVM / legacy testID split.
    await expect(element(by.text("Discover"))).toBeVisible();
  });
});
