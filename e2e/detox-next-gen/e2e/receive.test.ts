/**
 * Bitcoin Receive flow (Wallet 4.0) with verify-on-device via Speculos.
 *
 * Boots with no accounts, lets the app auto-discover BTC accounts via
 * Speculos, then drives the Verify Address screen end-to-end using
 * `expectValidAddressDevice` from `@ledgerhq/live-common/e2e/speculos`.
 *
 * Pre-reqs (env): SEED, COINAPPS (local) or REMOTE_SPECULOS=true + SPECULINHO_URL.
 */
import { device, element, by, expect, waitFor } from "detox";
import { launchApp, closeApp } from "../helpers/launchApp";
import { loadConfig } from "../helpers/loadConfig";
import { launchSpeculos, shutdownSpeculos, SpeculosHandle } from "../helpers/speculos";
import { expectValidAddressDevice } from "@ledgerhq/live-common/e2e/speculos";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

const hasSpeculosEnv =
  !!process.env.SEED && (!!process.env.COINAPPS || process.env.REMOTE_SPECULOS === "true");

const maybeDescribe = hasSpeculosEnv ? describe : describe.skip;

maybeDescribe("Receive — Bitcoin verify-on-device via Speculos", () => {
  let handle: SpeculosHandle;

  beforeAll(async () => {
    await launchApp();
    await loadConfig("skip-onboarding-w40");
    handle = await launchSpeculos("Bitcoin");
  });

  afterAll(async () => {
    if (handle) await shutdownSpeculos(handle);
    closeApp();
  });

  it("verifies the receive address on Speculos", async () => {
    // 1. Wallet 4.0 empty home — Quick-Action Transfer → Receive opens the
    //    modular drawer in receive mode. Sync ON here: navigation works
    //    cleanly and the app isn't yet talking to Speculos.
    await waitFor(element(by.id("quick-actions-ctas")))
      .toBeVisible()
      .withTimeout(15_000);
    await element(by.id("quick-action-transfer")).tap();
    await waitFor(element(by.id("transfer-action-receive")))
      .toBeVisible()
      .withTimeout(5_000);
    await element(by.id("transfer-action-receive")).tap();

    // 2. Modular drawer: search BTC, pick Bitcoin.
    await waitFor(element(by.id("modular-drawer-search-input")))
      .toBeVisible()
      .withTimeout(10_000);
    await element(by.id("modular-drawer-search-input")).typeText("BTC");
    await waitFor(element(by.text("Bitcoin")).atIndex(0))
      .toBeVisible()
      .withTimeout(10_000);
    await element(by.text("Bitcoin")).atIndex(0).tap();

    // 3. "Add new or existing account" — tapping this starts BIP44
    //    discovery (a stream of get_address APDUs against Speculos).
    //    From here Speculos keeps APDU requests pending and the app
    //    is perpetually "busy" — disable Detox sync immediately AFTER
    //    the tap so subsequent waitFor / tap calls don't deadlock on
    //    waiting for app idle.
    await waitFor(element(by.id("add-new-account-button")))
      .toBeVisible()
      .withTimeout(10_000);
    await element(by.id("add-new-account-button")).tap();
    await device.disableSynchronization();

    // 4. Wait for discovery to settle and tap Confirm. With sync off
    //    waitFor polls the UI directly.
    await waitFor(element(by.text("Confirm")))
      .toBeVisible()
      .withTimeout(180_000);
    await element(by.text("Confirm")).tap();

    // 5. ReceiveSecurityModal → "Verify my address".
    await waitFor(element(by.id("button-verify-my-address")))
      .toBeVisible()
      .withTimeout(30_000);
    await element(by.id("button-verify-my-address")).tap();

    // 6. Wait for the VerifyAddress screen and read the address the app
    //    is asking the device to verify.
    await waitFor(element(by.id("receive-verifyAddress-freshAdress")))
      .toBeVisible()
      .withTimeout(30_000);
    const addressAttrs = await element(by.id("receive-verifyAddress-freshAdress")).getAttributes();
    const addressFromApp =
      "elements" in addressAttrs
        ? (addressAttrs.elements[0].text ?? "")
        : (addressAttrs.text ?? "");
    if (!addressFromApp) throw new Error("could not read receive-verifyAddress-freshAdress");
    await device.takeScreenshot("verify-address-app-side");

    // 7. Drive Speculos: wait for the verify label, press right until
    //    Confirm appears, assert the on-device address matches what the
    //    app sent, then press both buttons to accept. Reads
    //    SPECULOS_API_PORT (set by launchSpeculos) under the hood.
    await expectValidAddressDevice(Account.BTC_NATIVE_SEGWIT_1, addressFromApp);

    // 7. After Speculos confirms, the app transitions to the final
    //    Receive screen (Confirmation 03) with the QR code + address.
    await waitFor(element(by.id("receive-fresh-address")))
      .toBeVisible()
      .withTimeout(30_000);
    await device.takeScreenshot("receive-address-verified");
  });
});
