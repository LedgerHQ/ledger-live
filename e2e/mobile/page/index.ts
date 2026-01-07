import AssetAccountsPage from "./accounts/assetAccounts.page";
import AccountPage from "./accounts/account.page";
import AccountsPage from "./accounts/accounts.page";
import AddAccountDrawer from "./accounts/addAccount.drawer";
import CommonPage from "./common.page";
import CustomLockscreenPage from "./stax/customLockscreen.page";
import DeviceValidationPage from "./trade/deviceValidation.page";
import DiscoverPage from "./discover/discover.page";
import LedgerSyncPage from "./settings/ledgerSync.page";
import ManagerPage from "./manager/manager.page";
import MarketPage from "./market/market.page";
import OnboardingStepsPage from "./onboarding/onboardingSteps.page";
import OperationDetailsPage from "./trade/operationDetails.page";
import PasswordEntryPage from "./passwordEntry.page";
import PortfolioEmptyStatePage from "./wallet/portfolioEmptyState.page";
import PortfolioPage from "./wallet/portfolio.page";
import ReceivePage from "./trade/receive.page";
import SendPage from "./trade/send.page";
import SettingsGeneralPage from "./settings/settingsGeneral.page";
import SettingsHelpPage from "./settings/settingsHelp.page";
import SettingsPage from "./settings/settings.page";
import SpeculosPage from "./speculos.page";
import StakePage from "./trade/stake.page";
import SwapPage from "./trade/swap.page";
import SwapLiveAppPage from "./liveApps/swapLiveApp";
import WalletTabNavigatorPage from "./wallet/walletTabNavigator.page";
import CeloManageAssetsPage from "./trade/celoManageAssets.page";
import TransferMenuDrawer from "./wallet/transferMenu.drawer";
import BuySellPage from "./trade/buySell.page";
import EarnDashboardPage from "./trade/earnDasboard.page";
import ModularDrawer from "./drawer/modular.drawer";

import path from "path";
import fs from "fs";
import { InitializationManager, InitOptions } from "../utils/initUtil";
import { randomUUID } from "crypto";

export type ApplicationOptions = InitOptions;

export const getUserdataPath = (userdata: string) => {
  return path.resolve("userdata", `${userdata}.json`);
};

const lazyInit = <T>(PageClass: new () => T) => {
  let instance: T | null = null;
  return () => {
    if (!instance) instance = new PageClass();
    return instance;
  };
};

export class Application {
  private assetAccountsPageInstance = lazyInit(AssetAccountsPage);
  private accountPageInstance = lazyInit(AccountPage);
  private accountsPageInstance = lazyInit(AccountsPage);
  private addAccountDrawerInstance = lazyInit(AddAccountDrawer);
  private commonPageInstance = lazyInit(CommonPage);
  private customLockscreenPageInstance = lazyInit(CustomLockscreenPage);
  private deviceValidationPageInstance = lazyInit(DeviceValidationPage);
  private discoverPageInstance = lazyInit(DiscoverPage);
  private ledgerSyncPageInstance = lazyInit(LedgerSyncPage);
  private managerPageInstance = lazyInit(ManagerPage);
  private marketPageInstance = lazyInit(MarketPage);
  private onboardingPageInstance = lazyInit(OnboardingStepsPage);
  private operationDetailsPageInstance = lazyInit(OperationDetailsPage);
  private passwordEntryPageInstance = lazyInit(PasswordEntryPage);
  private portfolioEmptyStatePageInstance = lazyInit(PortfolioEmptyStatePage);
  private portfolioPageInstance = lazyInit(PortfolioPage);
  private receivePageInstance = lazyInit(ReceivePage);
  private sendPageInstance = lazyInit(SendPage);
  private settingsPageInstance = lazyInit(SettingsPage);
  private settingsGeneralPageInstance = lazyInit(SettingsGeneralPage);
  private speculosPageInstance = lazyInit(SpeculosPage);
  private stakePageInstance = lazyInit(StakePage);
  private swapLiveAppInstance = lazyInit(SwapLiveAppPage);
  private swapPageInstance = lazyInit(SwapPage);
  private walletTabNavigatorPageInstance = lazyInit(WalletTabNavigatorPage);
  private celoManageAssetsPageInstance = lazyInit(CeloManageAssetsPage);
  private TransferMenuDrawerInstance = lazyInit(TransferMenuDrawer);
  private buySellPageInstance = lazyInit(BuySellPage);
  private settingsHelpPageInstance = lazyInit(SettingsHelpPage);
  private earnDashboardPageInstance = lazyInit(EarnDashboardPage);
  private modularDrawerPageInstance = lazyInit(ModularDrawer);

  @Step("Account initialization")
  public async init(options: ApplicationOptions) {
    const userdataSpeculos = `temp-userdata-${randomUUID()}`;
    const userdataPath = getUserdataPath(userdataSpeculos);
    fs.copyFileSync(getUserdataPath(options.userdata || "skip-onboarding"), userdataPath);
    try {
      await InitializationManager.initialize(options, userdataPath, userdataSpeculos);
    } finally {
      fs.unlinkSync(userdataPath);
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

  public get common() {
    return this.commonPageInstance();
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

  public get ledgerSync() {
    return this.ledgerSyncPageInstance();
  }

  public get manager() {
    return this.managerPageInstance();
  }

  public get market() {
    return this.marketPageInstance();
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

  public get portfolioEmptyState() {
    return this.portfolioEmptyStatePageInstance();
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

  public get walletTabNavigator() {
    return this.walletTabNavigatorPageInstance();
  }

  public get celoManageAssets() {
    return this.celoManageAssetsPageInstance();
  }

  public get transferMenuDrawer() {
    return this.TransferMenuDrawerInstance();
  }

  public get buySell() {
    return this.buySellPageInstance();
  }

  public get settingsHelp() {
    return this.settingsHelpPageInstance();
  }

  public get earnDashboard() {
    return this.earnDashboardPageInstance();
  }

  public get modularDrawer() {
    return this.modularDrawerPageInstance();
  }
}
