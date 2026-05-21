import { initReceiveFlowApp, openReceive } from "./receiveFlow.shared";
import DeviceAction from "../../models/DeviceAction";

describe("Receive Flow — create account on OP Mainnet", () => {
  let deviceAction: DeviceAction;

  beforeAll(async () => {
    deviceAction = await initReceiveFlowApp();
  });

  $TmsLink("B2CQA-1856");
  $TmsLink("B2CQA-1862");
  it("Should create an account on a network", async () => {
    const currency = Currency.OP;
    await openReceive();
    await app.modularDrawer.performSearchByTicker("ETH");
    await app.modularDrawer.selectCurrencyByTicker(Currency.ETH.ticker);
    await app.modularDrawer.selectNetworkIfAsked(currency.name);

    await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();
    await deviceAction.selectMockDevice();
    await deviceAction.openApp();
    await app.addAccount.addAccountAtIndex(Currency.OP.name, Currency.OP.id, 2);
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed("ETH", "OP Mainnet 3");
  });
});
