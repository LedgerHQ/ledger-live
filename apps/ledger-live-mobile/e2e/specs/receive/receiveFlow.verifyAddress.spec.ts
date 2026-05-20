import { initReceiveFlowApp, openReceive } from "./receiveFlow.shared";
import DeviceAction from "../../models/DeviceAction";

describe("Receive Flow — verify address", () => {
  let deviceAction: DeviceAction;
  const btcReceiveAddress = "173ej2furpaB8mTtN5m9829MPGMD7kCgSPx";

  beforeAll(async () => {
    deviceAction = await initReceiveFlowApp();
  });

  $TmsLink("B2CQA-1864");
  it("Should verify the address after importing an account working on a single network", async () => {
    await openReceive();
    await app.modularDrawer.performSearchByTicker("BTC");
    await app.modularDrawer.selectCurrencyByTicker(Currency.BTC.ticker);
    await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();

    await deviceAction.selectMockDevice();
    await deviceAction.openApp();
    await app.addAccount.addAccountAtIndex(Currency.BTC.name, Currency.BTC.id, 0);
    await app.receive.selectVerifyAddress();
    await deviceAction.openApp();
    await app.receive.expectAddressIsVerified(btcReceiveAddress);
    await deviceAction.complete();
    await app.receive.expectAddressIsDisplayed(btcReceiveAddress);
  });
});
