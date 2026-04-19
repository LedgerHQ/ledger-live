import DeviceAction from "../../models/DeviceAction";
import {
  initReceiveFlowModularDrawerApp,
  openReceiveModularDrawerFlow,
  receiveFlowKnownDevice,
  selectMockDeviceOnce,
} from "./receiveFlowModularDrawerSetup";

describe("Receive Flow — set B (networks and existing account)", () => {
  let deviceAction: DeviceAction;
  const firstDeviceSelectRef = { value: true };

  beforeAll(async () => {
    await initReceiveFlowModularDrawerApp();
    deviceAction = new DeviceAction(receiveFlowKnownDevice);

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  $TmsLink("B2CQA-650");
  it("Should access to receive after importing a cryptocurrency on a selected network", async () => {
    await openReceiveModularDrawerFlow();
    await app.modularDrawer.performSearchByTicker("ETH");
    await app.modularDrawer.selectCurrencyByTicker(Currency.ETH.ticker);
    await app.modularDrawer.selectNetworkIfAsked("Arbitrum");
    await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();
    await selectMockDeviceOnce(firstDeviceSelectRef, deviceAction);
    await deviceAction.openApp();
    await app.addAccount.addAccountAtIndex("Arbitrum", "arbitrum", 0);
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed("ETH", "Arbitrum 1");
  });

  $TmsLink("B2CQA-1859");
  it("Should access to receive after selecting an existing account", async () => {
    await openReceiveModularDrawerFlow();
    await app.modularDrawer.performSearchByTicker("XRP");
    await app.modularDrawer.selectCurrencyByTicker(Currency.XRP.ticker);
    await app.modularDrawer.selectAccount(1);
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed("XRP", "XRP 2");
  });
});
