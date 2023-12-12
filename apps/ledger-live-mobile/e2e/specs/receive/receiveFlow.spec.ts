import PortfolioPage from "../../models/wallet/portfolioPage";
import ReceivePage from "../../models/trade/receivePage";
import { loadBleState, loadConfig } from "../../bridge/server";
import DeviceAction from "../../models/DeviceAction";
import { knownDevice } from "../../models/devices";
import Common from "../../models/common";

let portfolioPage: PortfolioPage;
let deviceAction: DeviceAction;
let receivePage: ReceivePage;
let common: Common;
const btcReceiveAddress = "173ej2furpaB8mTtN5m9829MPGMD7kCgSPx";

describe("Receive Flow", () => {
  beforeAll(async () => {
    loadConfig("EthAccountXrpAccountReadOnlyFalse", true);
    loadBleState({ knownDevices: [knownDevice] });
    portfolioPage = new PortfolioPage();
    deviceAction = new DeviceAction(knownDevice);
    receivePage = new ReceivePage();
    common = new Common();
  });

  async function openReceive() {
    await portfolioPage.openViaDeeplink();
    await portfolioPage.waitForPortfolioPageToLoad();
    await receivePage.openViaDeeplink();
  }

  it("Should verify the address after importing an account working on a single network", async () => {
    await portfolioPage.waitForPortfolioPageToLoad();
    await portfolioPage.openTransferMenu();
    await portfolioPage.navigateToReceiveFromTransferMenu();
    await common.performSearch("bitcoin");
    await receivePage.selectAsset("BTC");
    await deviceAction.selectMockDevice();
    await deviceAction.openApp();
    await receivePage.selectAccount("Bitcoin 1");
    await receivePage.selectVerifyAddress();
    await deviceAction.openApp();
    await receivePage.expectAddressIsVerified(btcReceiveAddress);
  });

  it("Should display the number of account existing per networks", async () => {
    await openReceive();
    await receivePage.selectAsset("ETH");
    await receivePage.expectNumberOfAccountInListIsDisplayed("ethereum", 3);
    await receivePage.expectNumberOfAccountInListIsDisplayed("optimism", 1);
  });

  it("Should create an account on a network", async () => {
    await openReceive();
    await receivePage.selectAsset("ETH");
    await receivePage.selectCurrency("optimism");
    await receivePage.createAccount();
    await deviceAction.openApp();
    await receivePage.selectAccount("OP Mainnet 1");
    await receivePage.selectAccount("OP Mainnet 2");
    await receivePage.selectAccount("OP Mainnet 3");
    await receivePage.continueCreateAccount();
    await receivePage.expectAccountIsCreated("OP Mainnet 3");
  });

  it("Should access to receive after importing a cryptocurrency on a selected network", async () => {
    await openReceive();
    await common.performSearch("pol");
    await receivePage.selectAsset("MATIC");
    await receivePage.selectCurrency("bsc");
    await deviceAction.openApp();
    await receivePage.selectAccount("Binance Smart Chain 1");
    await receivePage.selectDontVerifyAddress();
    await receivePage.selectReconfirmDontVerify();
    await receivePage.expectReceivePageIsDisplayed("BNB", "Binance Smart Chain 1");
  });

  it("Should access to receive after selecting an existing account", async () => {
    await openReceive();
    await receivePage.selectAsset("XRP");
    await receivePage.selectAccount("XRP 2");
    await receivePage.selectDontVerifyAddress();
    await receivePage.selectReconfirmDontVerify();
    await receivePage.expectReceivePageIsDisplayed("XRP", "XRP 2");
  });
});
