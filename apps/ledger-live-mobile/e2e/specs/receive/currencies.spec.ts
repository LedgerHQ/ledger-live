import { loadBleState, loadConfig } from "../../bridge/server";
import PortfolioPage from "../../models/wallet/portfolioPage";
import ReceivePage from "../../models/trade/receivePage";
import DeviceAction from "../../models/DeviceAction";
import { knownDevice } from "../../models/devices";
import Common from "../../models/common";
import { waitForElementById } from "../../helpers";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

let portfolioPage: PortfolioPage;
let receivePage: ReceivePage;
let deviceAction: DeviceAction;
let common: Common;
let first = true;

describe("Receive different currency", () => {
  beforeAll(async () => {
    loadConfig("onboardingcompleted", true);
    loadBleState({ knownDevices: [knownDevice] });

    portfolioPage = new PortfolioPage();
    deviceAction = new DeviceAction(knownDevice);
    receivePage = new ReceivePage();
    common = new Common();

    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it.each([
    ["bitcoin"],
    ["ethereum", "Ethereum"],
    ["bsc"],
    ["ripple"],
    //["solana"], // TOFIX Error during flow
    ["cardano"],
    ["dogecoin"],
    ["tron"],
    ["avalanche_c_chain"],
    ["polygon", "Polygon"],
    ["polkadot"],
    ["cosmos", "Cosmos"],
  ])("receive on %p (through scanning)", async (currencyId: string, network: string = "") => {
    const currency = getCryptoCurrencyById(currencyId);
    const currencyName = getCryptoCurrencyById(currencyId).name;

    await receivePage.openViaDeeplink();
    await common.performSearch(currencyName);
    await receivePage.selectCurrency(currencyName);
    if (network) {
      await receivePage.selectNetwork(network);
    }
    if (first) {
      await deviceAction.selectMockDevice();
      first = false;
    }
    await deviceAction.openApp();
    await receivePage.selectAccount(`${currencyName} 2`);
    await receivePage.doNotVerifyAddress();
    await waitForElementById(receivePage.accountAddress);
    await receivePage.expectReceivePageIsDisplayed(currency.ticker, `${currencyName} 2`);
  });
});
