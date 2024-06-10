import DeviceAction from "../models/DeviceAction";
import { knownDevice } from "../models/devices";
import { deviceInfo155 as deviceInfo } from "@ledgerhq/live-common/apps/mock";
import { Application } from "../page/index";

let app: Application;
let deviceAction: DeviceAction;

const appDesc = ["Bitcoin", "Tron", "Litecoin", "Ethereum", "XRP", "Stellar"];
const installedDesc = ["Bitcoin", "Litecoin", "Ethereum (outdated)"];

describe("Bitcoin Account", () => {
  beforeAll(async () => {
    app = await Application.init("onboardingcompleted", [knownDevice]);
    deviceAction = new DeviceAction(knownDevice);

    await app.portfolio.waitForPortfolioPageToLoad();
  });

  $TmsLink("B2CQA-657");
  it("open manager", async () => {
    await app.portfolio.openMyLedger();
    await deviceAction.selectMockDevice();
    await deviceAction.accessManager(appDesc.join(","), installedDesc.join(","));
    await app.manager.waitForManagerPageToLoad();
  });

  $TmsLink("B2CQA-658");
  it("displays device informations", async () => {
    await app.manager.checkDeviceName(knownDevice.name);
    await app.manager.checkDeviceVersion(deviceInfo.version);
    await app.manager.checkDeviceAppsNStorage(appDesc, installedDesc);
  });
});
