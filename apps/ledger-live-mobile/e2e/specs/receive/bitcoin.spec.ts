import { loadBleState, loadConfig } from "../../bridge/server";
import PortfolioPage from "../../models/wallet/portfolioPage";
import DepositPage from "../../models/trade/depositPage";
import DeviceAction from "../../models/DeviceAction";
import { DeviceModelId } from "@ledgerhq/devices";
import { tapById, tapByText, waitForElementById, waitForElementByText } from "../../helpers";

let portfolioPage: PortfolioPage;
let depositPage: DepositPage;
let deviceAction: DeviceAction;

const knownDevice = {
  name: "Nano X de test",
  id: "mock_1",
  modelId: DeviceModelId.nanoX,
};

const currency = "bitcoin";
const accountName = "Bitcoin 2";

describe("Bitcoin 2 account", () => {
  beforeAll(async () => {
    loadConfig("onboardingcompleted", true);
    loadBleState({ knownDevices: [knownDevice] });

    portfolioPage = new PortfolioPage();
    deviceAction = new DeviceAction(knownDevice);
    depositPage = new DepositPage();

    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it("clicks on receive from portfolio", async () => {
    await depositPage.openViaDeeplink();
  });

  it("receive on Bitcoin 2 (through scanning)", async () => {
    await depositPage.selectCurrency(currency);
    await deviceAction.selectMockDevice();
    await deviceAction.openApp();

    await waitForElementByText(accountName);
    await tapByText(accountName);
    await waitForElementById(depositPage.noVerifyAddressButton);
  });

  it("don't verify the address", async () => {
    await tapById(depositPage.noVerifyAddressButton);
    await tapById(depositPage.noVerifyValidateButton);
    await waitForElementById(depositPage.accountAddress);
  });
});
