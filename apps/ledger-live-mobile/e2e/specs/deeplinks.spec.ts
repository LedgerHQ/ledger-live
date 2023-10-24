import { device, expect } from "detox";
import { loadConfig } from "../bridge/server";
import { getElementByText, isAndroid } from "../helpers";

import CustomLockscreenPage from "../models/stax/customLockscreenPage";
import DiscoverPage from "../models/discover/discoverPage";
import ManagerPage from "../models/manager/managerPage";
import PortfolioPage from "../models/wallet/portfolioPage";
import SendPage from "../models/trade/sendPage";
import SwapFormPage from "../models/trade/swapFormPage";
import ReceivePage from "../models/trade/receivePage";
import OnboardingSteps from "../models/onboarding/onboardingSteps";
import AccountAssetPage from "../models/accounts/accountAssetPage";

let accountAssetPage: AccountAssetPage;
let onboardingSteps: OnboardingSteps;
let customLockscreenPage: CustomLockscreenPage;
let discoverPage: DiscoverPage;
let managerPage: ManagerPage;
let portfolioPage: PortfolioPage;
let sendPage: SendPage;
let swapFormPage: SwapFormPage;
let receivePage: ReceivePage;

const ethereumLong = "Ethereum";
const bitcoinLong = "Bitcoin";
const arbitrumLong = "Arbitrum";
const bobaLong = "Boba";

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
  { name: "Zerion", url: " https://zerion.io/" },
  { name: "Rainbow", url: " https://rainbow.me" },
  { name: "POAP", url: " https://app.poap.xyz/" },
  { name: "Yearn", url: " https://beta.yearn.finance" },
  { name: "ChangeNOW", url: " https://changenow.io/" },
  { name: "Transak", url: " https://transak.com" },
];

const openNCheckApp = (l10n: { name: string; url: string }) => {
  it(`should open discovery to ${l10n.name}`, async () => {
    await discoverPage.openViaDeeplink(l10n.name);
    await expect(getElementByText(l10n.url)).toBeVisible();
  });
};

describe("DeepLinks Tests", () => {
  beforeAll(async () => {
    loadConfig("1AccountBTC1AccountETHReadOnlyFalse", true);

    // accountPage = new AccountPage();
    accountAssetPage = new AccountAssetPage();
    onboardingSteps = new OnboardingSteps();
    customLockscreenPage = new CustomLockscreenPage();
    discoverPage = new DiscoverPage();
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
    await expect(managerPage.managerTitle()).toBeVisible();
    await onboardingSteps.addDeviceViaBluetooth("David");
  });

  it("should open ETH Account Asset page when given currency param", async () => {
    await accountAssetPage.openAssetScreenViaDeeplink(ethereumLong);
    await accountAssetPage.waitForAccountAssetsToLoad(ethereumLong);
    await expect(getElementByText("Your Ethereum")).toBeVisible();
  });

  it("should open BTC Account Asset page when given currency param", async () => {
    await accountAssetPage.openAssetScreenViaDeeplink(bitcoinLong);
    // await accountAssetPage.waitForAccountAssetsToLoad(bitcoinLong); // FIXME: times out - unclear why
    await expect(getElementByText("Your Bitcoin")).toBeVisible();
  });

  it("should open Custom Lock Screen page", async () => {
    await customLockscreenPage.openViaDeeplink();
    await customLockscreenPage.expectCustomLockscreenPage();
    await expect(customLockscreenPage.welcomeChoosePictureButton()).toBeVisible();
  });

  it("should open the Discover page", async () => {
    await discoverPage.openViaDeeplink();
    await expect(getElementByText("Discover")).toBeVisible();
  });

  it("should open a live app and be able to navigate to and from crypto select screen", async () => {
    if (!isAndroid()) return;
    await discoverPage.openViaDeeplink(mercuryoDL.name);
    await discoverPage.waitForSelectCrypto();
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
  });

  it("should open Receive pages", async () => {
    await receivePage.openViaDeeplink();
    await expect(receivePage.getStep1HeaderTitle()).toBeVisible();
    await portfolioPage.openViaDeeplink();
    await receivePage.receiveViaDeeplink(ethereumLong);
    await expect(receivePage.getStep2HeaderTitle()).toBeVisible();
    await expect(receivePage.getStep2Networks()).toBeVisible();
    await expect(getElementByText(ethereumLong)).toBeVisible();
    await expect(getElementByText(arbitrumLong)).toBeVisible();
    await expect(getElementByText(bobaLong)).toBeVisible();
  });
});
