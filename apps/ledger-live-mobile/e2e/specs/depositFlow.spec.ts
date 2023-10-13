import PortfolioPage from "../models/wallet/portfolioPage";
import DepositPage from "../models/trade/depositPage";
import { loadBleState, loadConfig } from "../bridge/server";
import DeviceAction from "../models/DeviceAction";
import { DeviceModelId } from "@ledgerhq/devices";
import Common from "../models/common";

let portfolioPage: PortfolioPage;
let deviceAction: DeviceAction;
let depositPage: DepositPage;
let common: Common;
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
    deviceAction = new DeviceAction(knownDevice);
    depositPage = new DepositPage();
    common = new Common();
  });

  async function openDeposit() {
    await portfolioPage.openViaDeeplink();
    await portfolioPage.waitForPortfolioPageToLoad();
    await depositPage.openViaDeeplink();
  }

  it("Should verify the address after importing an account working on a single network", async () => {
    await portfolioPage.waitForPortfolioPageToLoad();
    await portfolioPage.openTransferMenu();
    await portfolioPage.navigateToDepositFromTransferMenu();
    await common.performSearch("bitcoin");
    await depositPage.selectAsset("BTC");
    await deviceAction.selectMockDevice();
    await deviceAction.openApp();
    await depositPage.selectAccount("Bitcoin 1");
    await depositPage.selectVerifyAddress();
    await deviceAction.openApp();
    await depositPage.expectAddressIsVerified(btcDepositAddress);
  });

  it("Should display the number of account existing per networks", async () => {
    await openDeposit();
    await depositPage.selectAsset("ETH");
    await depositPage.expectNumberOfAccountInListIsDisplayed("ethereum", 3);
    await depositPage.expectNumberOfAccountInListIsDisplayed("optimism", 1);
  });

  it("Should create an account on a network", async () => {
    await openDeposit();
    await depositPage.selectAsset("ETH");
    await depositPage.selectCurrency("optimism");
    await depositPage.createAccount();
    await deviceAction.openApp();
    await depositPage.selectAccount("OP Mainnet 1");
    await depositPage.selectAccount("OP Mainnet 2");
    await depositPage.selectAccount("OP Mainnet 3");
    await depositPage.continueCreateAccount();
    await depositPage.expectAccountIsCreated("OP Mainnet 3");
  });

  it("Should access to deposit after importing a cryptocurrency on a selected network", async () => {
    await openDeposit();
    await common.performSearch("pol");
    await depositPage.selectAsset("MATIC");
    await depositPage.selectCurrency("bsc");
    await deviceAction.openApp();
    await depositPage.selectAccount("Binance Smart Chain 1");
    await depositPage.selectDontVerifyAddress();
    await depositPage.selectReconfirmDontVerify();
    await depositPage.expectDepositPageIsDisplayed("BNB", "Binance Smart Chain 1");
  });

  it("Should access to deposit after selecting an existing account", async () => {
    await openDeposit();
    await depositPage.selectAsset("XRP");
    await depositPage.selectAccount("XRP 2");
    await depositPage.selectDontVerifyAddress();
    await depositPage.selectReconfirmDontVerify();
    await depositPage.expectDepositPageIsDisplayed("XRP", "XRP 2");
  });
});
