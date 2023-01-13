import { device, expect } from "detox";
import { loadConfig } from "../bridge/server";
import {
  getElementById,
  getElementByText,
  tapByText,
  waitForElementByText,
} from "../helpers";
import PortfolioPage from "../models/wallet/portfolioPage";
import SwapFormPage from "../models/swap/swapFormPage";
import DiscoveryPage from "../models/discovery/discoveryPage";
import SendPage from "../models/send/sendPage";
import ManagerPage from "../models/manager/managerPage";
import * as bridge from "../bridge/server";

let portfolioPage: PortfolioPage;
let swapFormPage: SwapFormPage;
let discoveryPage: DiscoveryPage;
let sendPage: SendPage;
let managerPage: ManagerPage;

let baseDeeplink: string = "ledgerlive://";
let customLockscreenDL: string = "custom-image";
let portfolioDL: string = "portfolio";
let accountsDL: string = "accounts";
let currencyParam: string = "?currency=";
let accountIdParam: string = "?accountId=";
let ethereumShort: string = "eth";
let bitcoinShort: string = "btc";
let ethereumLong: string = "Ethereum";
let bitcoinLong: string = "Bitcoin";

//send?currency=ethereum&recipient=0x51F84CA8BA6fC3310aD37b3696dc9CA309353eA6&amount=0.5
let sendDL: string = "send";
let recipientParam: string = "&recipient=";
let address: string = "0x51F84CA8BA6fC3310aD37b3696dc9CA309353eA6";
let amountParam: string = "&amount=";
let value: string = "0.5";

//"receive?currency=ethereum"
let receiveDL: string = "receive";

//"buy/bitcoin"
let buyDL: string = "buy/";

let managerDL: string = "myledger";

let swapDL: string = "swap";

let discoverDL: string = "discover/";
let mercuryoDL: string = "Mercuryo";
const discoverApps = [
  { link: "ParaSwap" },
  { link: "MoonPay" },
  { link: "Ramp" },
  { link: "Lido" },
  { link: "1inch" },
  { link: "BTCDirect", name: "BTC Direct" },
  { link: "Wyre_buy", name: "Wyre" },
  { link: "Zerion" },
  { link: "Rainbow", name: "Rainbow.me" },
  { link: "POAP" },
];

let deviceName = "Nano X de David";

async function openDeepLink(link?: string) {
  await device.openURL({ url: baseDeeplink + link });
}

const openNCheckApp = (l10n: { link: string; name?: string }) => {
  it(`should open discovery to ${l10n.link}`, async () => {
    l10n.name = l10n.name || l10n.link;
    await openDeepLink(discoverDL + l10n.link);
    await expect(getElementByText(l10n.name)).toBeVisible();
  });
};

describe("DeepLinks Tests", () => {
  beforeAll(async () => {
    await loadConfig("1AccountBTC1AccountETH", true);
    portfolioPage = new PortfolioPage();
    swapFormPage = new SwapFormPage();
    managerPage = new ManagerPage();
    sendPage = new SendPage();
    discoveryPage = new DiscoveryPage();
  });

  it("should open on Portofolio page", async () => {
    await expect(portfolioPage.getSettingsButton()).toBeVisible();
  });

  it("should open My Ledger page", async () => {
    await openDeepLink(managerDL);
    await expect(managerPage.getManagerTitle()).toBeVisible();
    await managerPage.getPairDeviceButton().tap();
    bridge.addDevices();
    await waitForElementByText(deviceName, 3000);
    await tapByText(deviceName);
    bridge.setInstalledApps(); // tell LLM what apps the mock device has
    bridge.open();
    await managerPage.waitProceedButton();
    await managerPage.getProceedButton();
    await openDeepLink(portfolioDL);
  });

  it("should open Custom Lock Screen page", async () => {
    await openDeepLink(customLockscreenDL);
    await expect(
      getElementById("custom-image-choose-picture-button"),
    ).toBeVisible();
    await openDeepLink(portfolioDL);
  });

  it("should open Accounts page", async () => {
    await openDeepLink(accountsDL);
    await expect(getElementById("accounts-list-title")).toBeVisible();
    await openDeepLink(accountsDL + currencyParam + ethereumLong);
    await expect(
      getElementById(`accounts-title-${ethereumLong}`),
    ).toBeVisible();
    await openDeepLink(accountsDL + currencyParam + bitcoinLong);
    await expect(getElementById(`accounts-title-${bitcoinLong}`)).toBeVisible();
  });

  it("should open Discover page", async () => {
    if (device.getPlatform() !== "android") return;
    await openDeepLink(discoverDL);
    await expect(discoveryPage.getDicoveryBanner()).toBeVisible();
    await openDeepLink(discoverDL + mercuryoDL);
    await discoveryPage.waitForSelectCrypto();
    await device.pressBack();
    await expect(getElementByText(mercuryoDL)).toBeVisible();
  });

  for (const l10n of discoverApps) {
    openNCheckApp(l10n);
  }

  it("should open Swap page", async () => {
    await openDeepLink(swapDL);
    await expect(swapFormPage.getSwapFormTab()).toBeVisible;
  });

  it("should open Send page", async () => {
    await openDeepLink(sendDL);
    await expect(sendPage.getHeaderTitleStep1()).toBeVisible();
    await openDeepLink(portfolioDL);
    await openDeepLink(sendDL + currencyParam + ethereumLong);
    await expect(sendPage.getSearchField()).toHaveText(ethereumLong);
  });
});
