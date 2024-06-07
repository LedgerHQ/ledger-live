import { loadBleState, loadConfig } from "../../bridge/server";
import DeviceAction from "../../models/DeviceAction";
import { knownDevice } from "../../models/devices";
import { Application } from "../../page/index";

let app: Application;
let deviceAction: DeviceAction;
const btcReceiveAddress = "173ej2furpaB8mTtN5m9829MPGMD7kCgSPx";
let first = true;

describe("Receive Flow", () => {
  beforeAll(async () => {
    await loadConfig("EthAccountXrpAccountReadOnlyFalse", true);
    await loadBleState({ knownDevices: [knownDevice] });
    app = new Application();
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
    await app.portfolio.openTransferMenu();
    await app.portfolio.navigateToReceiveFromTransferMenu();
    await app.common.performSearch("Bitcoin");
    await app.receive.selectAsset("BTC");
    await deviceAction.selectMockDevice();
    first = false;
    await deviceAction.openApp();
    await app.receive.selectAccount("Bitcoin 1");
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
    await app.receive.expectNumberOfAccountInListIsDisplayed("Ethereum", 3);
    await app.receive.expectNumberOfAccountInListIsDisplayed("OP Mainnet", 1);
  });

  $TmsLink("B2CQA-1856");
  $TmsLink("B2CQA-1862");
  it("Should create an account on a network", async () => {
    await openReceive();
    await app.receive.selectAsset("ETH");
    await app.receive.selectNetwork("OP Mainnet");
    await app.receive.createAccount();
    if (first) {
      await deviceAction.selectMockDevice();
      first = false;
    }
    await deviceAction.openApp();
    await app.receive.selectAccount("OP Mainnet 1");
    await app.receive.selectAccount("OP Mainnet 2");
    await app.receive.selectAccount("OP Mainnet 3");
    await app.receive.continueCreateAccount();
    await app.receive.expectAccountIsCreated("OP Mainnet 3");
  });

  $TmsLink("B2CQA-650");
  it("Should access to receive after importing a cryptocurrency on a selected network", async () => {
    await openReceive();
    await app.common.performSearch("Polygon");
    await app.receive.selectAsset("MATIC");
    await app.receive.selectNetwork("Binance Smart Chain");
    if (first) {
      await deviceAction.selectMockDevice();
      first = false;
    }
    await deviceAction.openApp();
    await app.receive.selectAccount("Binance Smart Chain 1");
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
