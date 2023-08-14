import { device } from "detox";
import { loadBleState, loadConfig } from "../../bridge/server";
import PortfolioPage from "../../models/wallet/portfolioPage";
import ReceivePage from "../../models/receive";
import DeviceAction from "../../models/DeviceAction";
import { DeviceModelId } from "@ledgerhq/devices";
import { tapByText, waitForElementById, waitForElementByText } from "../../helpers";

let portfolioPage: PortfolioPage;
let receivePage: ReceivePage;
let deviceAction: DeviceAction;

const knownDevice = {
  name: "Nano X de test",
  id: "mock_1",
  modelId: DeviceModelId.nanoX,
};

describe("Bitcoin 2 account", () => {
  beforeAll(async () => {
    loadConfig("onboardingcompleted", true);
    loadBleState({ knownDevices: [knownDevice] });

    portfolioPage = new PortfolioPage();
    deviceAction = new DeviceAction(knownDevice);
    receivePage = new ReceivePage();

    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it("receive from portfolio", async () => {
    await receivePage.openViaDeeplink();
  });

  it("receive on Bitcoin 2 (through scanning)", async () => {
    await receivePage.selectCurrency("bitcoin");

    // device actions and add accounts modal have animations that requires to disable synchronization default detox behavior
    await device.disableSynchronization();
    await deviceAction.selectMockDevice();
    await deviceAction.openApp();

    await waitForElementByText("Bitcoin 2");
    await tapByText("Bitcoin 2");
    await waitForElementById("receive-fresh-address");
  });

  // TODO: TO BE CONTINUED
  /*
  it("verifies the address", async () => {
    await waitForElementByText("Verify my address");
    await tapByText("Verify my address");
    await waitForElementByText("Address verified");
  });
  */
});
