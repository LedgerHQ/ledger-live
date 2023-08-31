import { expect, device } from "detox";
import { loadBleState, loadConfig } from "../bridge/server";
import PortfolioPage from "../models/wallet/portfolioPage";
import DeviceAction from "../models/DeviceAction";
import ManagerPage from "../models/manager/managerPage";
import { DeviceModelId } from "@ledgerhq/devices";
import { getElementByText, waitForElementByText } from "../helpers";

let portfolioPage: PortfolioPage;
let deviceAction: DeviceAction;
let managerPage: ManagerPage;

const knownDevice = {
  name: "Nano X de test",
  id: "mock_1",
  modelId: DeviceModelId.nanoX,
};

describe("Bitcoin Account", () => {
  beforeAll(async () => {
    loadConfig("onboardingcompleted", true);
    loadBleState({ knownDevices: [knownDevice] });

    portfolioPage = new PortfolioPage();
    deviceAction = new DeviceAction(knownDevice);
    managerPage = new ManagerPage();

    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it("open manager", async () => {
    await portfolioPage.openMyLedger();
    // device actions have animations that requires to disable synchronization default detox behavior
    await device.disableSynchronization();
    await deviceAction.selectMockDevice();
    await deviceAction.accessManager();
    await managerPage.waitForManagerPageToLoad();
  });

  it("displays device name", async () => {
    await waitForElementByText(knownDevice.name);
    await expect(getElementByText(knownDevice.name)).toExist();
  });
});
