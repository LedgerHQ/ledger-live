import AssetAccountsPage from "./accounts/assetAccounts.page";
import AccountsPage from "./accounts/accounts.page";
import AddAccountDrawer from "./accounts/addAccount.drawer";
import CommonPage from "./common.page";
import CryptoDrawer from "./liveApps/cryptoDrawer";
import CustomLockscreenPage from "./stax/customLockscreen.page";
import DiscoverPage from "./discover/discover.page";
import DummyWalletApp from "./liveApps/dummyWalletApp.webView";
import WalletAPIReceivePage from "./liveApps/walletAPIReceive";
import WalletAPISignMessage from "./liveApps/walletAPISignMessage";
import ManagerPage from "./manager/manager.page";
import MarketPage from "./market/market.page";
import OnboardingStepsPage from "./onboarding/onboardingSteps.page";
import OperationDetailsPage from "./trade/operationDetails.page";
import PasswordEntryPage from "./passwordEntry.page";
import PortfolioPage from "./wallet/portfolio.page";
import ReceivePage from "./trade/receive.page";
import SendPage from "./trade/send.page";
import SettingsGeneralPage from "./settings/settingsGeneral.page";
import SettingsPage from "./settings/settings.page";
import StakePage from "./trade/stake.page";
import SwapPage from "./trade/swap.page";
import TransferMenuDrawer from "./wallet/transferMenu.drawer";
import WalletTabNavigatorPage from "./wallet/walletTabNavigator.page";
import ModularDrawer from "./drawer/modular.drawer";

import type { Account } from "@ledgerhq/types-live";
import { DeviceLike } from "~/reducers/types";
import { loadAccounts, loadBleState, loadConfig, setFeatureFlags } from "../bridge/server";
import { initTestAccounts } from "../models/currencies";
import { setupEnvironment } from "../helpers/commonHelpers";
import { SettingsSetOverriddenFeatureFlagsPlayload } from "~/actions/types";

setupEnvironment();

type ApplicationOptions = {
  userdata?: string;
  knownDevices?: DeviceLike[];
  testedCurrencies?: string[];
  featureFlags?: SettingsSetOverriddenFeatureFlagsPlayload;
};

const lazyInit = <T>(PageClass: new () => T) => {
  let instance: T | null = null;
  return () => {
    if (!instance) instance = new PageClass();
    return instance;
  };
};

export class Application {
  public testAccounts: Account[] = [];
  private assetAccountsPageInstance = lazyInit(AssetAccountsPage);
  private accountsPageInstance = lazyInit(AccountsPage);
  private addAccountDrawerInstance = lazyInit(AddAccountDrawer);
  private commonPageInstance = lazyInit(CommonPage);
  private cryptoDrawerInstance = lazyInit(CryptoDrawer);
  private customLockscreenPageInstance = lazyInit(CustomLockscreenPage);
  private discoverPageInstance = lazyInit(DiscoverPage);
  private dummyWalletAppInstance = lazyInit(DummyWalletApp);
  private walletAPIReceivePageInstance = lazyInit(WalletAPIReceivePage);
  private walletAPISignMessagePageInstance = lazyInit(WalletAPISignMessage);
  private managerPageInstance = lazyInit(ManagerPage);
  private marketPageInstance = lazyInit(MarketPage);
  private onboardingPageInstance = lazyInit(OnboardingStepsPage);
  private operationDetailsPageInstance = lazyInit(OperationDetailsPage);
  private passwordEntryPageInstance = lazyInit(PasswordEntryPage);
  private portfolioPageInstance = lazyInit(PortfolioPage);
  private receivePageInstance = lazyInit(ReceivePage);
  private sendPageInstance = lazyInit(SendPage);
  private settingsPageInstance = lazyInit(SettingsPage);
  private settingsGeneralPageInstance = lazyInit(SettingsGeneralPage);
  private stakePageInstance = lazyInit(StakePage);
  private swapPageInstance = lazyInit(SwapPage);
  private transferMenuDrawerInstance = lazyInit(TransferMenuDrawer);
  private walletTabNavigatorPageInstance = lazyInit(WalletTabNavigatorPage);
  private modularDrawerPageInstance = lazyInit(ModularDrawer);

  public async init({
    userdata,
    knownDevices,
    testedCurrencies,
    featureFlags,
  }: ApplicationOptions) {
    userdata && (await loadConfig(userdata, true));

    knownDevices && (await loadBleState({ knownDevices }));
    if (testedCurrencies) {
      this.testAccounts = initTestAccounts(testedCurrencies);
      await loadAccounts(this.testAccounts);
    }

    if (featureFlags) {
      await setFeatureFlags(featureFlags);
    }
  }

  public get assetAccountsPage() {
    return this.assetAccountsPageInstance();
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

  public get cryptoDrawer() {
    return this.cryptoDrawerInstance();
  }

  public get customLockscreen() {
    return this.customLockscreenPageInstance();
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

  public get walletAPISignMessage() {
    return this.walletAPISignMessagePageInstance();
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

  public get stake() {
    return this.stakePageInstance();
  }

  public get swap() {
    return this.swapPageInstance();
  }

  public get transferMenu() {
    return this.transferMenuDrawerInstance();
  }

  public get walletTabNavigator() {
    return this.walletTabNavigatorPageInstance();
  }

  public get modularDrawer() {
    return this.modularDrawerPageInstance();
  }
}
