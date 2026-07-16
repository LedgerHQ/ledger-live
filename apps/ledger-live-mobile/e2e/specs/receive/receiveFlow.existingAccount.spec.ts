import { initReceiveFlowApp, openReceive } from "./receiveFlow.shared";

// TODO(LIVE-33334): these legacy mock specs will be removed in a follow-up task;
// skipped for now.
describe.skip("Receive Flow — existing account", () => {
  beforeAll(async () => {
    await initReceiveFlowApp();
  });

  $TmsLink("B2CQA-1859");
  it("Should access to receive after selecting an existing account", async () => {
    await openReceive();
    await app.modularDrawer.performSearchByTicker("XRP");
    await app.modularDrawer.selectCurrencyByTicker(Currency.XRP.ticker);
    await app.modularDrawer.selectAccount(1);
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed("XRP", "XRP 2");
  });
});
