import { expect, device } from "detox";
import PortfolioPage from "../models/wallet/portfolioPage";
import Deposit from "../models/deposit";
import { loadBleState, loadConfig } from "../bridge/server";
import DeviceAction from "../models/DeviceAction";
import { DeviceModelId } from "@ledgerhq/devices";

let portfolioPage: PortfolioPage;
let depositPage: Deposit;
let deviceAction: DeviceAction;
const btcDepositAddress = "173ej2furpaB8mTtN5m9829MPGMD7kCgSPx";

const knownDevice = {
  name: "Nano X de test",
  id: "mock_1",
  modelId: DeviceModelId.nanoX,
};

describe("Deposit", () => {
  beforeAll(async () => {
    loadConfig("EthAccountXrpAccountReadOnlyFalse", true);
    loadBleState({ knownDevices: [knownDevice] });
    portfolioPage = new PortfolioPage();
    depositPage = new Deposit();
    deviceAction = new DeviceAction(knownDevice);
  });

  it("Should verify the deposit adress after importing an account", async () => {
    await portfolioPage.waitForPortfolioPageToLoad();
    await portfolioPage.openTransferMenu();
    await portfolioPage.navigateToDepositFromTransferMenu();
    await depositPage.searchAsset("bitcoin");
    await depositPage.selectAsset("BTC");
    await device.disableSynchronization();
    await deviceAction.selectMockDevice();
    await deviceAction.openApp();
  });
});
