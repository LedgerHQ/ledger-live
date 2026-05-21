import { initReceiveFlowApp, openReceive } from "./receiveFlow.shared";
import DeviceAction from "../../models/DeviceAction";

describe("Receive Flow — Arbitrum import", () => {
  let deviceAction: DeviceAction;

  beforeAll(async () => {
    deviceAction = await initReceiveFlowApp();
  });

  $TmsLink("B2CQA-650");
  it("Should access to receive after importing a cryptocurrency on a selected network", async () => {
    await openReceive();
    await app.modularDrawer.performSearchByTicker("ETH");
    await app.modularDrawer.selectCurrencyByTicker(Currency.ETH.ticker);
    await app.modularDrawer.selectNetworkIfAsked("Arbitrum");
    await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();
    await deviceAction.selectMockDevice();
    await deviceAction.openApp();
    await app.addAccount.addAccountAtIndex("Arbitrum", "arbitrum", 0);
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed("ETH", "Arbitrum 1");
  });
});
