import { loadBleState, loadConfig } from "../../bridge/server";
import PortfolioPage from "../../models/wallet/portfolioPage";
import ReceivePage from "../../models/trade/receivePage";
import DeviceAction from "../../models/DeviceAction";
import { knownDevice } from "../../models/devices";
import { tapById, tapByText, waitForElementById, waitForElementByText } from "../../helpers";

let portfolioPage: PortfolioPage;
let receivePage: ReceivePage;
let deviceAction: DeviceAction;

const currency = "bitcoin";
const accountName = "Bitcoin 2";

describe("Bitcoin 2 account", () => {
  beforeAll(async () => {
    loadConfig("onboardingcompleted", true);
    loadBleState({ knownDevices: [knownDevice] });

    portfolioPage = new PortfolioPage();
    deviceAction = new DeviceAction(knownDevice);
    receivePage = new ReceivePage();

    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it("clicks on receive from portfolio", async () => {
    await receivePage.openViaDeeplink();
  });

  it("receive on Bitcoin 2 (through scanning)", async () => {
    await receivePage.selectCurrency(currency);
    await deviceAction.selectMockDevice();
    await deviceAction.openApp();

    await waitForElementByText(accountName);
    await tapByText(accountName);
    await waitForElementById(receivePage.noVerifyAddressButton);
  });

  it("don't verify the address", async () => {
    await tapById(receivePage.noVerifyAddressButton);
    await tapById(receivePage.noVerifyValidateButton);
    await waitForElementById(receivePage.accountAddress);
  });
});
