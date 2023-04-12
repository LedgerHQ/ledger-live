import { device, expect } from "detox";
import { loadConfig } from "../bridge/server";
import { getElementByText, isAndroid } from "../helpers";
import AccountPage from "../models/accounts/accountPage";
import AccountsPage from "../models/accounts/accountsPage";
import CustomLockscreenPage from "../models/stax/customLockscreenPage";
import DiscoveryPage from "../models/discovery/discoveryPage";
import ManagerPage from "../models/manager/managerPage";
import PortfolioPage from "../models/wallet/portfolioPage";
import SendPage from "../models/trade/sendPage";
import SwapFormPage from "../models/trade/swapFormPage";
import ReceivePage from "../models/trade/receivePage";

let accountPage: AccountPage;
let accountsPage: AccountsPage;
let customLockscreenPage: CustomLockscreenPage;
let discoveryPage: DiscoveryPage;
let managerPage: ManagerPage;
let portfolioPage: PortfolioPage;
let sendPage: SendPage;
let swapFormPage: SwapFormPage;
let receivePage: ReceivePage;

let ethereumShort: string = "eth";
let bitcoinShort: string = "btc";
let ethereumLong: string = "Ethereum";
let bitcoinLong: string = "Bitcoin";

let deviceName = "Nano X de David";
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

const openNCheckApp = (l10n: { link: string; name?: string }) => {
  it(`should open discovery to ${l10n.link}`, async () => {
    l10n.name = l10n.name || l10n.link;
    await discoveryPage.openViaDeeplink(l10n.link);
    await expect(getElementByText(l10n.name)).toBeVisible();
  });
};

describe("DeepLinks Tests", () => {
  beforeAll(async () => {
    await loadConfig("1AccountBTC1AccountETH", true);
    accountPage = new AccountPage();
    accountsPage = new AccountsPage();
    customLockscreenPage = new CustomLockscreenPage();
    discoveryPage = new DiscoveryPage();
    managerPage = new ManagerPage();
    portfolioPage = new PortfolioPage();
    sendPage = new SendPage();
    swapFormPage = new SwapFormPage();
    receivePage = new ReceivePage();
  });

  it.only("should open on Portofolio page", async () => {
    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it.only("should open My Ledger page and add a device", async () => {
    await managerPage.openViaDeeplink();
    await managerPage.expectManagerPage();
    await managerPage.addDevice(deviceName);
    await portfolioPage.openViaDeeplink();
  });

  it("should open Custom Lock Screen page", async () => {
    await customLockscreenPage.openViaDeeplink();
    await customLockscreenPage.expectCustomLockscreenPage();
    await expect(
      customLockscreenPage.welcomeChoosePictureButton(),
    ).toBeVisible();
    await portfolioPage.openViaDeeplink();
  });

  it("should open Accounts page", async () => {
    await accountsPage.openViaDeeplink();
    await accountsPage.waitForAccountsPageToLoad();
  });

  it("should open ETH & BTC Account pages", async () => {
    await accountPage.openViaDeeplink(ethereumLong);
    await accountPage.waitForAccountPageToLoad(ethereumLong);
    await accountPage.openViaDeeplink(bitcoinLong);
    await accountPage.waitForAccountPageToLoad(bitcoinLong);
  });

  it("should open Discover page and Mercuryo", async () => {
    if (!(await isAndroid())) return;
    await discoveryPage.openViaDeeplink();
    await discoveryPage.expectDiscoveryPage();
    await discoveryPage.openViaDeeplink(mercuryoDL);
    await discoveryPage.waitForSelectCrypto();
    await device.pressBack();
    await expect(getElementByText(mercuryoDL)).toBeVisible();
  });

  for (const l10n of discoverApps) {
    openNCheckApp(l10n);
  }

  it.only("should open Swap Form page", async () => {
    await swapFormPage.openViaDeeplink();
    await swapFormPage.expectSwapFormPage();
  });

  it("should open Send pages", async () => {
    await sendPage.openViaDeeplink();
    await expect(sendPage.getStep1HeaderTitle()).toBeVisible();
    await portfolioPage.openViaDeeplink();
    await sendPage.sendViaDeeplink(ethereumLong);
    await expect(sendPage.getStep1HeaderTitle()).toBeVisible();
    await expect(sendPage.getSearchField()).toHaveText(ethereumLong);
    await portfolioPage.openViaDeeplink();
  });

  it("should open Receive pages", async () => {
    await receivePage.openViaDeeplink();
    await expect(receivePage.getStep1HeaderTitle()).toBeVisible();
    await portfolioPage.openViaDeeplink();
    await receivePage.receiveViaDeeplink(ethereumLong);
    await expect(receivePage.getStep2HeaderTitle()).toBeVisible();
    await expect(receivePage.getStep2Accounts()).toBeVisible();
    await expect(getElementByText(ethereumLong + " 1"));
    await expect(getElementByText(ethereumLong + " 2"));
    await expect(getElementByText(ethereumLong + " 3"));

    await portfolioPage.openViaDeeplink();
  });
});
