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

const ethereumShort = "eth";
const bitcoinShort = "btc";
const ethereumLong = "Ethereum";
const bitcoinLong = "Bitcoin";

const deviceName = "Nano X de David";
const mercuryoDL = { name: "Mercuryo", url: " https://www.mercuryo.io/" };
const discoverApps = [
  { name: "MoonPay", url: " https://www.moonpay.com/" },
  { name: "Ramp", url: " https://ramp.network/buy" },
  { name: "ParaSwap", url: " https://paraswap.io" },
  { name: "Lido", url: " https://lido.fi/" },
  { name: "1inch", url: " https://1inch.io/" },
  { name: "BTCDirect", url: " https://btcdirect.eu/" },
  { name: "Banxa", url: " https://banxa.com/" },
  { name: "Bitrefill", url: " https://bitrefill.com" },
  { name: "Wyre_buy", url: " https://www.sendwyre.com/" },
  { name: "Zerion", url: " https://zerion.io/" },
  { name: "Rainbow", url: " https://rainbow.me" },
  { name: "POAP", url: " https://app.poap.xyz/" },
  { name: "Yearn", url: " https://beta.yearn.finance" },
  { name: "ChangeNOW", url: " https://changenow.io/" },
  { name: "Transak", url: " https://transak.com" },
];

const openNCheckApp = (l10n: { name: string; url: string }) => {
  it(`should open discovery to ${l10n.name}`, async () => {
    await discoveryPage.openViaDeeplink(l10n.name);
    await expect(getElementByText(l10n.url)).toBeVisible();
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

  it("should open on Portofolio page", async () => {
    await portfolioPage.waitForPortfolioPageToLoad();
  });

  it("should open My Ledger page and add a device", async () => {
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
    await discoveryPage.openViaDeeplink(mercuryoDL.name);
    await discoveryPage.waitForSelectCrypto();
    await device.pressBack();
    await expect(getElementByText(mercuryoDL.url)).toBeVisible();
  });

  for (const l10n of discoverApps) {
    openNCheckApp(l10n);
  }

  it("should open Swap Form page", async () => {
    await swapFormPage.openViaDeeplink();
    await expect(swapFormPage.swapFormTab()).toBeVisible();
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
