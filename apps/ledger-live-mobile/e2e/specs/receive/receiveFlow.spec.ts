import DeviceAction from "../../models/DeviceAction";
import { knownDevices } from "../../models/devices";

describe("Receive Flow", () => {
  let deviceAction: DeviceAction;
  const btcReceiveAddress = "173ej2furpaB8mTtN5m9829MPGMD7kCgSPx";
  let first = true;
  const knownDevice = knownDevices.nanoX;

  beforeAll(async () => {
    await app.init({
      userdata: "EthAccountXrpAccountReadOnlyFalse",
      knownDevices: [knownDevice],
    });
    deviceAction = new DeviceAction(knownDevice);

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  async function openReceive() {
    await app.portfolio.openViaDeeplink();
    await app.portfolio.waitForPortfolioPageToLoad();
    await app.receive.openViaDeeplink();
  }

  $TmsLink("B2CQA-1864");
  it("Should verify the address after importing an account working on a single network", async () => {
    await app.transferMenu.open();
    await app.transferMenu.navigateToReceive();
    await app.common.performSearch("Bitcoin");
    await app.receive.selectAsset("BTC");
    first && (await deviceAction.selectMockDevice(), (first = false));
    await deviceAction.openApp();
    await app.addAccount.addAccountAtIndex(Currency.BTC.name, Currency.BTC.id, 0);
    await app.addAccount.tapAddFunds();
    await app.addAccount.tapReceiveinActionDrawer();
    await app.receive.selectVerifyAddress();
    await deviceAction.openApp();
    await app.receive.expectAddressIsVerified(btcReceiveAddress);
    await deviceAction.complete();
    await app.receive.expectAddressIsDisplayed(btcReceiveAddress);
  });

  $TmsLink("B2CQA-1858");
  $TmsLink("B2CQA-1860");
  it("Should display the number of account existing per networks", async () => {
    await openReceive();
    await app.receive.selectAsset("ETH");
    await app.receive.expectNumberOfAccountInListIsDisplayed("ethereum", 3);
    await app.receive.expectNumberOfAccountInListIsDisplayed("optimism", 1);
  });

  $TmsLink("B2CQA-1856");
  $TmsLink("B2CQA-1862");
  it("Should create an account on a network", async () => {
    const currency = Currency.OP;
    await openReceive();
    await app.receive.selectAsset("ETH");
    await app.receive.selectNetwork(currency.id);
    await app.receive.createAccount();
    first && (await deviceAction.selectMockDevice(), (first = false));
    await deviceAction.openApp();
    await app.addAccount.addAccountAtIndex(Currency.OP.name, Currency.OP.id, 2);
    await app.receive.expectAccountIsCreated("OP Mainnet 3");
  });

  $TmsLink("B2CQA-650");
  it("Should access to receive after importing a cryptocurrency on a selected network", async () => {
    await openReceive();
    await app.common.performSearch("Polygon");
    await app.receive.selectAsset("POL");
    await app.receive.selectNetwork("bsc");
    first && (await deviceAction.selectMockDevice(), (first = false));
    await deviceAction.openApp();
    await app.addAccount.addAccountAtIndex(Currency.BSC.name, Currency.BSC.id, 0);
    await app.addAccount.tapAddFunds();
    await app.addAccount.tapReceiveinActionDrawer();
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed("BNB", "Binance Smart Chain 1");
  });

  $TmsLink("B2CQA-1859");
  it("Should access to receive after selecting an existing account", async () => {
    await openReceive();
    await app.receive.selectAsset("XRP");
    await app.receive.selectAccount("XRP 2");
    await app.receive.doNotVerifyAddress();
    await app.receive.expectReceivePageIsDisplayed("XRP", "XRP 2");
  });
});
