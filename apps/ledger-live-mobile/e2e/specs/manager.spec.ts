import { loadBleState, loadConfig } from "../bridge/server";
import PortfolioPage from "../models/wallet/portfolioPage";
import DeviceAction from "../models/DeviceAction";
import ManagerPage from "../models/manager/managerPage";
import { knownDevice } from "../models/devices";
import { deviceInfo155 as deviceInfo } from "@ledgerhq/live-common/apps/mock";

let portfolioPage: PortfolioPage;
let deviceAction: DeviceAction;
let managerPage: ManagerPage;

const appDesc = ["Bitcoin", "Tron", "Litecoin", "Ethereum", "XRP", "Stellar"];
const installedDesc = ["Bitcoin", "Litecoin", "Ethereum (outdated)"];

describe("Bitcoin Account", () => {
  beforeAll(async () => {
    await loadConfig("onboardingcompleted", true);
    await loadBleState({ knownDevices: [knownDevice] });

    portfolioPage = new PortfolioPage();
    deviceAction = new DeviceAction(knownDevice);
    managerPage = new ManagerPage();

    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it("open manager", async () => {
    await portfolioPage.openMyLedger();
    await deviceAction.selectMockDevice();
    await deviceAction.accessManager(appDesc.join(","), installedDesc.join(","));
    await managerPage.waitForManagerPageToLoad();
  });

  it("displays device informations", async () => {
    await managerPage.checkDeviceName(knownDevice.name);
    await managerPage.checkDeviceVersion(deviceInfo.version);
    await managerPage.checkDeviceAppsNStorage(appDesc, installedDesc);
  });
});
