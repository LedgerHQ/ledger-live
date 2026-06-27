/**
 * Bitcoin Receive flow (Wallet 4.0) with verify-on-device via Speculos.
 *
 * Boots with no accounts, lets the app auto-discover BTC accounts via
 * Speculos, then drives the Verify Address screen end-to-end using
 * `expectValidAddressDevice` from `@ledgerhq/live-common/e2e/speculos`.
 *
 * Page-object driven: UI steps go through `app.*`; the device-side step
 * stays inline (it's a live-common call, not UI).
 *
 * Pre-reqs (env): SEED, COINAPPS (local) or REMOTE_SPECULOS=true + SPECULINHO_URL.
 */
import { device } from "detox";
import { startSession, endSession } from "../../helpers/session";
import { SpeculosHandle } from "../../helpers/speculos";
import { expectValidAddressDevice } from "@ledgerhq/live-common/e2e/speculos";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { app } from "../../pages";

describe("Receive — Bitcoin verify-on-device via Speculos", () => {
  let handle: SpeculosHandle;

  beforeAll(async () => {
    handle = await startSession({ userdata: "skip-onboarding-w40", speculosApp: "Bitcoin" });
  });

  afterAll(() => endSession(handle));

  it("verifies the receive address on Speculos", async () => {
    // 1. Wallet 4.0 empty home → Transfer → Receive. Sync ON here:
    //    navigation is clean and the app isn't talking to Speculos yet.
    await app.wallet.openTransferMenu();
    await app.transferMenu.tapReceive();

    // 2. Modular drawer: search BTC, pick Bitcoin.
    await app.modularDrawer.chooseAsset("BTC", "Bitcoin");

    // 3. "Add new or existing account" starts BIP44 discovery (a stream of
    //    get_address APDUs). Speculos then keeps APDU requests pending and
    //    the app is perpetually "busy" — disable Detox sync immediately
    //    AFTER the tap so subsequent waits don't deadlock on app-idle.
    await app.receive.addNewAccount();
    await device.disableSynchronization();

    // 4. Wait for discovery to settle and confirm. With sync off, native
    //    waits poll the UI directly.
    await app.receive.confirmAccountAddition();

    // 5. ReceiveSecurityModal → "Verify my address".
    await app.receive.verifyMyAddress();

    // 6. Read the address the app is asking the device to verify.
    const addressFromApp = await app.receive.getAddressToVerify();

    // 7. Drive Speculos: assert the on-device address matches what the app
    //    sent, then accept. Reads SPECULOS_API_PORT (set by launchSpeculos).
    await expectValidAddressDevice(Account.BTC_NATIVE_SEGWIT_1, addressFromApp);

    // 8. After Speculos confirms, the app transitions to the final Receive
    //    screen (Confirmation 03) with the QR code + address.
    await app.receive.expectAddressVerified();
  });
});
