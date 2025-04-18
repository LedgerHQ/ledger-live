import AssetAccountsPage from "./accounts/assetAccounts.page";
import AccountPage from "./accounts/account.page";
import AccountsPage from "./accounts/accounts.page";
import AddAccountDrawer from "./accounts/addAccount.drawer";
import BuyDevicePage from "./discover/buyDevice.page";
import CommonPage from "./common.page";
import CryptoDrawer from "./liveApps/cryptoDrawer";
import CustomLockscreenPage from "./stax/customLockscreen.page";
import DeviceValidationPage from "./trade/deviceValidation.page";
import DiscoverPage from "./discover/discover.page";
import DummyWalletApp from "./liveApps/dummyWalletApp.webView";
import WalletAPIReceivePage from "./liveApps/walletAPIReceive";
import LedgerSyncPage from "./settings/ledgerSync.page";
import ManagerPage from "./manager/manager.page";
import MarketPage from "./market/market.page";
import NftGalleryPage from "./wallet/nftGallery.page";
import NftViewerPage from "./nft/nftViewer.page";
import OnboardingStepsPage from "./onboarding/onboardingSteps.page";
import OperationDetailsPage from "./trade/operationDetails.page";
import PasswordEntryPage from "./passwordEntry.page";
import PortfolioPage from "./wallet/portfolio.page";
import ReceivePage from "./trade/receive.page";
import SendPage from "./trade/send.page";
import SettingsGeneralPage from "./settings/settingsGeneral.page";
import SettingsPage from "./settings/settings.page";
import SpeculosPage from "./speculos.page";
import StakePage from "./trade/stake.page";
import SwapPage from "./trade/swap.page";
import SwapLiveAppPage from "./liveApps/swapLiveApp";
import TransfertMenuDrawer from "./wallet/transferMenu.drawer";
import WalletTabNavigatorPage from "./wallet/walletTabNavigator.page";
import CeloManageAssetsPage from "./trade/celoManageAssets.page";

import type { Account } from "@ledgerhq/types-live";
import { DeviceLike } from "~/reducers/types";
import { loadAccounts, loadBleState, loadConfig, setFeatureFlags } from "../bridge/server";
import { lastValueFrom, Observable } from "rxjs";
import path from "path";
import fs from "fs";
import { SettingsSetOverriddenFeatureFlagsPlayload } from "~/actions/types";
import { getEnv } from "@ledgerhq/live-env";
import { log } from "detox";
import { AppInfosType } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { initTestAccounts } from "../models/currencies";
import { setupEnvironment } from "../helpers/commonHelpers";

setupEnvironment();

type CliCommand = (userdataPath?: string) => Observable<unknown> | Promise<unknown> | string;

type ApplicationOptions = {
  speculosApp?: AppInfosType;
  cliCommands?: CliCommand[];
  cliCommandsOnApp?: {
    app: AppInfosType;
    cmd: CliCommand;
  }[];
  userdata?: string;
  knownDevices?: DeviceLike[];
  testedCurrencies?: string[];
  featureFlags?: SettingsSetOverriddenFeatureFlagsPlayload;
};

export const getUserdataPath = (userdata: string) => {
  return path.resolve("e2e", "userdata", `${userdata}.json`);
};

const lazyInit = <T>(PageClass: new () => T) => {
  let instance: T | null = null;
  return () => {
    if (!instance) instance = new PageClass();
    return instance;
  };
};

async function executeCliCommand(cmd: CliCommand, userdataPath?: string) {
  const promise = await cmd(userdataPath);
  const result = promise instanceof Observable ? await lastValueFrom(promise) : await promise;
  log.info("CLI result: ", result);
}

export class Application {
  public testAccounts: Account[] = [];
  private assetAccountsPageInstance = lazyInit(AssetAccountsPage);
  private accountPageInstance = lazyInit(AccountPage);
  private accountsPageInstance = lazyInit(AccountsPage);
  private addAccountDrawerInstance = lazyInit(AddAccountDrawer);
  private buyDevicePageInstance = lazyInit(BuyDevicePage);
  private commonPageInstance = lazyInit(CommonPage);
  private cryptoDrawerInstance = lazyInit(CryptoDrawer);
  private customLockscreenPageInstance = lazyInit(CustomLockscreenPage);
  private deviceValidationPageInstance = lazyInit(DeviceValidationPage);
  private discoverPageInstance = lazyInit(DiscoverPage);
  private dummyWalletAppInstance = lazyInit(DummyWalletApp);
  private walletAPIReceivePageInstance = lazyInit(WalletAPIReceivePage);
  private ledgerSyncPageInstance = lazyInit(LedgerSyncPage);
  private managerPageInstance = lazyInit(ManagerPage);
  private marketPageInstance = lazyInit(MarketPage);
  private nftGalleryPageInstance = lazyInit(NftGalleryPage);
  private nftViewerPageInstance = lazyInit(NftViewerPage);
  private onboardingPageInstance = lazyInit(OnboardingStepsPage);
  private operationDetailsPageInstance = lazyInit(OperationDetailsPage);
  private passwordEntryPageInstance = lazyInit(PasswordEntryPage);
  private portfolioPageInstance = lazyInit(PortfolioPage);
  private receivePageInstance = lazyInit(ReceivePage);
  private sendPageInstance = lazyInit(SendPage);
  private settingsPageInstance = lazyInit(SettingsPage);
  private settingsGeneralPageInstance = lazyInit(SettingsGeneralPage);
  private speculosPageInstance = lazyInit(SpeculosPage);
  private stakePageInstance = lazyInit(StakePage);
  private swapLiveAppInstance = lazyInit(SwapLiveAppPage);
  private swapPageInstance = lazyInit(SwapPage);
  private transfertMenuDrawerInstance = lazyInit(TransfertMenuDrawer);
  private walletTabNavigatorPageInstance = lazyInit(WalletTabNavigatorPage);
  private celoManageAssetsPageInstance = lazyInit(CeloManageAssetsPage);

  public async init({
    speculosApp,
    cliCommands,
    cliCommandsOnApp,
    userdata,
    knownDevices,
    testedCurrencies,
    featureFlags,
  }: ApplicationOptions) {
    const userdataSpeculos = `temp-userdata-${Date.now()}`;
    const userdataPath = getUserdataPath(userdataSpeculos);

    if (!getEnv("MOCK"))
      fs.copyFileSync(getUserdataPath(userdata || "skip-onboarding"), userdataPath);

    for (const { app, cmd } of cliCommandsOnApp || []) {
      const proxyPort = await this.common.addSpeculos(app.name);
      await executeCliCommand(cmd, userdataPath);
      this.common.removeSpeculos(proxyPort);
    }

    if (speculosApp) await this.common.addSpeculos(speculosApp.name);
    for (const cmd of cliCommands || []) {
      await executeCliCommand(cmd, userdataPath);
    }

    if (!getEnv("MOCK")) {
      await loadConfig(userdataSpeculos, true);
      fs.existsSync(userdataPath) && fs.unlinkSync(userdataPath);
    } else userdata && (await loadConfig(userdata, true));

    featureFlags && (await setFeatureFlags(featureFlags));
    knownDevices && (await loadBleState({ knownDevices }));
    if (testedCurrencies) {
      this.testAccounts = initTestAccounts(testedCurrencies);
      await loadAccounts(this.testAccounts);
    }
  }

  public get assetAccountsPage() {
    return this.assetAccountsPageInstance();
  }
  public get account() {
    return this.accountPageInstance();
  }
  public get accounts() {
    return this.accountsPageInstance();
  }
  public get addAccount() {
    return this.addAccountDrawerInstance();
  }
  public get buyDevice() {
    return this.buyDevicePageInstance();
  }
  public get common() {
    return this.commonPageInstance();
  }
  public get cryptoDrawer() {
    return this.cryptoDrawerInstance();
  }
  public get customLockscreen() {
    return this.customLockscreenPageInstance();
  }
  public get deviceValidation() {
    return this.deviceValidationPageInstance();
  }
  public get discover() {
    return this.discoverPageInstance();
  }
  public get dummyWalletApp() {
    return this.dummyWalletAppInstance();
  }
  public get walletAPIReceive() {
    return this.walletAPIReceivePageInstance();
  }
  public get ledgerSync() {
    return this.ledgerSyncPageInstance();
  }
  public get manager() {
    return this.managerPageInstance();
  }
  public get market() {
    return this.marketPageInstance();
  }
  public get nftGallery() {
    return this.nftGalleryPageInstance();
  }
  public get nftViewer() {
    return this.nftViewerPageInstance();
  }
  public get onboarding() {
    return this.onboardingPageInstance();
  }
  public get operationDetails() {
    return this.operationDetailsPageInstance();
  }
  public get passwordEntry() {
    return this.passwordEntryPageInstance();
  }
  public get portfolio() {
    return this.portfolioPageInstance();
  }
  public get receive() {
    return this.receivePageInstance();
  }
  public get send() {
    return this.sendPageInstance();
  }
  public get settings() {
    return this.settingsPageInstance();
  }
  public get settingsGeneral() {
    return this.settingsGeneralPageInstance();
  }
  public get speculos() {
    return this.speculosPageInstance();
  }
  public get stake() {
    return this.stakePageInstance();
  }
  public get swap() {
    return this.swapPageInstance();
  }
  public get swapLiveApp() {
    return this.swapLiveAppInstance();
  }
  public get transfertMenu() {
    return this.transfertMenuDrawerInstance();
  }
  public get walletTabNavigator() {
    return this.walletTabNavigatorPageInstance();
  }
  public get celoManageAssets() {
    return this.celoManageAssetsPageInstance();
  }
}
