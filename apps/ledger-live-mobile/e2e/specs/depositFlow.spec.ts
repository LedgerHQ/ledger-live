import { device } from "detox";
import PortfolioPage from "../models/wallet/portfolioPage";
import ReceivePage from "../models/receive";
import Deposit from "../models/deposit";
import { loadBleState, loadConfig } from "../bridge/server";
import DeviceAction from "../models/DeviceAction";
import { DeviceModelId } from "@ledgerhq/devices";

let portfolioPage: PortfolioPage;
let depositPage: Deposit;
let deviceAction: DeviceAction;
let receivePage: ReceivePage;
const btcDepositAddress = "173ej2furpaB8mTtN5m9829MPGMD7kCgSPx";

const knownDevice = {
  name: "Nano X de test",
  id: "mock_1",
  modelId: DeviceModelId.nanoX,
};

describe("Deposit Flow", () => {
  beforeAll(async () => {
    loadConfig("EthAccountXrpAccountReadOnlyFalse", true);
    loadBleState({ knownDevices: [knownDevice] });
    portfolioPage = new PortfolioPage();
    depositPage = new Deposit();
    deviceAction = new DeviceAction(knownDevice);
    receivePage = new ReceivePage();
  });

  beforeEach(async () => {
    await device.launchApp();
  });

  it("Should verify the address after importing an account working on a single network", async () => {
    await portfolioPage.waitForPortfolioPageToLoad();
    await portfolioPage.openTransferMenu();
    await portfolioPage.navigateToDepositFromTransferMenu();
    await depositPage.searchAsset("bitcoin");
    await depositPage.selectAsset("BTC");
    await deviceAction.selectMockDevice();
    await deviceAction.openApp();
    await depositPage.selectAccount("Bitcoin 1");
    await depositPage.selectVerifyAddress();
    await deviceAction.openApp();
    await depositPage.expectAddressIsVerified(btcDepositAddress);
  });

  it("Should display the number of account existing per networks", async () => {
    await portfolioPage.openViaDeeplink();
    await portfolioPage.waitForPortfolioPageToLoad();
    await receivePage.openViaDeeplink();
    await depositPage.selectAsset("ETH");
    await depositPage.expectNumberOfAccountInListIsDisplayed("ethereum", 3);
    await depositPage.expectNumberOfAccountInListIsDisplayed("optimism", 1);
  });

  it("Should create an account on a network", async () => {
    await portfolioPage.openViaDeeplink();
    await portfolioPage.waitForPortfolioPageToLoad();
    await receivePage.openViaDeeplink();
    await depositPage.selectAsset("ETH");
    await receivePage.selectCurrency("optimism");
    await depositPage.createAccount();
    await deviceAction.openApp();
    await depositPage.selectAsset("OP Mainnet 1");
    await depositPage.selectAsset("OP Mainnet 2");
    await depositPage.selectAsset("OP Mainnet 3");
    await depositPage.continueCreateAccount();
    await depositPage.expectAccountIsCreated("OP Mainnet 3");
  });

  it("Should access to deposit after importing a cryptocurrency on a selected network", async () => {
    await portfolioPage.openViaDeeplink();
    await portfolioPage.waitForPortfolioPageToLoad();
    await receivePage.openViaDeeplink();
    await depositPage.searchAsset("pol");
    await depositPage.selectAsset("MATIC");
    await receivePage.selectCurrency("bsc");
    await deviceAction.openApp();
    await depositPage.selectAsset("Binance Smart Chain 1");
    await depositPage.selectDontVerifyAddress();
    await depositPage.selectReconfirmDontVerify();
    await depositPage.expectDepositPageIsDisplayed("BNB", "Binance Smart Chain 1");
  });

  it("Should access to deposit after selecting an existing account", async () => {
    await portfolioPage.openViaDeeplink();
    await portfolioPage.waitForPortfolioPageToLoad();
    await receivePage.openViaDeeplink();
    await depositPage.selectAsset("XRP");
    await depositPage.selectAsset("XRP 2");
    await depositPage.selectDontVerifyAddress();
    await depositPage.selectReconfirmDontVerify();
    await depositPage.expectDepositPageIsDisplayed("XRP", "XRP 2");
  });
});
