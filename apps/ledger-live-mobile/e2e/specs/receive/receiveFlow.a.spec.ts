import DeviceAction from "../../models/DeviceAction";
import {
  initReceiveFlowModularDrawerApp,
  openReceiveModularDrawerFlow,
  receiveFlowKnownDevice,
  selectMockDeviceOnce,
} from "./receiveFlowModularDrawerSetup";

describe("Receive Flow — set A (accounts and verify)", () => {
  let deviceAction: DeviceAction;
  const firstDeviceSelectRef = { value: true };
  const btcReceiveAddress = "173ej2furpaB8mTtN5m9829MPGMD7kCgSPx";

  beforeAll(async () => {
    await initReceiveFlowModularDrawerApp();
    deviceAction = new DeviceAction(receiveFlowKnownDevice);

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  $TmsLink("B2CQA-1864");
  it("Should verify the address after importing an account working on a single network", async () => {
    await openReceiveModularDrawerFlow();
    await app.modularDrawer.performSearchByTicker("BTC");
    await app.modularDrawer.selectCurrencyByTicker(Currency.BTC.ticker);
    await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();

    await selectMockDeviceOnce(firstDeviceSelectRef, deviceAction);
    await deviceAction.openApp();
    await app.addAccount.addAccountAtIndex(Currency.BTC.name, Currency.BTC.id, 0);
    await app.receive.selectVerifyAddress();
    await deviceAction.openApp();
    await app.receive.expectAddressIsVerified(btcReceiveAddress);
    await deviceAction.complete();
    await app.receive.expectAddressIsDisplayed(btcReceiveAddress);
  });

  $TmsLink("B2CQA-1858");
  $TmsLink("B2CQA-1860");
  it("Should display the number of account existing per networks", async () => {
    await openReceiveModularDrawerFlow();
    await app.modularDrawer.performSearchByTicker("ETH");
    await app.modularDrawer.selectCurrencyByTicker(Currency.ETH.ticker);
    await app.modularDrawer.expectNumberOfAccountInListIsDisplayed("Ethereum", 4);
    await app.modularDrawer.expectNumberOfAccountInListIsDisplayed("OP Mainnet", 1);
    await app.modularDrawer.tapDrawerCloseButton();
  });

  $TmsLink("B2CQA-1856");
  $TmsLink("B2CQA-1862");
  it("Should create an account on a network", async () => {
    const currency = Currency.OP;
    await openReceiveModularDrawerFlow();
    await app.modularDrawer.performSearchByTicker("ETH");
    await app.modularDrawer.selectCurrencyByTicker(Currency.ETH.ticker);
    await app.modularDrawer.selectNetworkIfAsked(currency.name);

    await app.modularDrawer.tapAddNewOrExistingAccountButtonMAD();
    await selectMockDeviceOnce(firstDeviceSelectRef, deviceAction);
    await deviceAction.openApp();
    await app.addAccount.addAccountAtIndex(Currency.OP.name, Currency.OP.id, 2);
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed("ETH", "OP Mainnet 3");
  });
});
