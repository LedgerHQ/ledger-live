import { Step } from "jest-allure2-reporter/api";
import AssetAccountsPage from "@e2e/page/accounts/assetAccounts.page";
import AccountPage from "@e2e/page/accounts/account.page";
import AccountsPage from "@e2e/page/accounts/accounts.page";
import AddAccountDrawer from "@e2e/page/accounts/addAccount.drawer";
import CommonPage from "@e2e/page/common.page";
import CustomLockscreenPage from "@e2e/page/stax/customLockscreen.page";
import DeviceValidationPage from "@e2e/page/trade/deviceValidation.page";
import DiscoverPage from "@e2e/page/discover/discover.page";
import LedgerSyncPage from "@e2e/page/settings/ledgerSync.page";
import TrustchainPage from "@e2e/page/trustchain.page";
import ManagerPage from "@e2e/page/manager/manager.page";
import MarketPage from "@e2e/page/market/market.page";
import OnboardingStepsPage from "@e2e/page/onboarding/onboardingSteps.page";
import OperationDetailsPage from "@e2e/page/trade/operationDetails.page";
import PasswordEntryPage from "@e2e/page/passwordEntry.page";
import PortfolioPage from "@e2e/page/wallet/portfolio.page";
import AssetDetailPage from "@e2e/page/wallet/assetDetail.page";
import ReceivePage from "@e2e/page/trade/receive.page";
import NewSendFlowPage from "@e2e/page/trade/newSendFlow.page";
import SendPage from "@e2e/page/trade/send.page";
import SettingsGeneralPage from "@e2e/page/settings/settingsGeneral.page";
import SettingsHelpPage from "@e2e/page/settings/settingsHelp.page";
import SettingsPage from "@e2e/page/settings/settings.page";
import SpeculosPage from "@e2e/page/speculos.page";
import StakePage from "@e2e/page/trade/stake.page";
import EvmStakePage from "@e2e/page/trade/evmStake.page";
import TezosStakePage from "@e2e/page/trade/tezosStake.page";
import SwapPage from "@e2e/page/trade/swap.page";
import SwapLiveAppPage from "@e2e/page/liveApps/swapLiveApp";
import MainNavigationPage from "@e2e/page/wallet/mainNavigation.page";
import MyWalletPage from "@e2e/page/wallet/myWallet.page";
import ContactsPage from "@e2e/page/wallet/contacts.page";
import OperationPage from "@e2e/page/wallet/operation.page";
import TopBarSearchPage from "@e2e/page/wallet/topBarSearch.page";
import CeloManageAssetsPage from "@e2e/page/trade/celoManageAssets.page";
import BorrowPage from "@e2e/page/trade/borrow.page";
import BuySellPage from "@e2e/page/trade/buySell.page";
import EarnV2DashboardPage from "@e2e/page/trade/earnV2Dashboard.page";
import ModularDrawer from "@e2e/page/drawer/modular.drawer";
import SwapTransactionStatusDrawer from "@e2e/page/drawer/swapTransactionStatus.drawer";
import UndelegatePage from "@e2e/page/trade/undelegate.page";
import Wallet40DrawersPage from "@e2e/page/drawer/wallet40Drawers.drawer";

import path from "path";
import fs from "fs";
import { InitializationManager, InitOptions } from "@e2e/utils/initUtil";
import { randomUUID } from "crypto";

export type ApplicationOptions = InitOptions;

export const getUserdataPath = (userdata: string) => {
  return path.resolve("userdata", `${userdata}.json`);
};

const lazyInit = <T>(PageClass: new () => T) => {
  let instance: T | null = null;
  return () => {
    instance ??= new PageClass();
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
  private trustchainPageInstance = lazyInit(TrustchainPage);
  private managerPageInstance = lazyInit(ManagerPage);
  private marketPageInstance = lazyInit(MarketPage);
  private onboardingPageInstance = lazyInit(OnboardingStepsPage);
  private operationDetailsPageInstance = lazyInit(OperationDetailsPage);
  private passwordEntryPageInstance = lazyInit(PasswordEntryPage);
  private portfolioPageInstance = lazyInit(PortfolioPage);
  private readonly assetDetailPageInstance = lazyInit(AssetDetailPage);
  private receivePageInstance = lazyInit(ReceivePage);
  private newSendFlowPageInstance = lazyInit(NewSendFlowPage);
  private sendPageInstance = lazyInit(SendPage);
  private settingsPageInstance = lazyInit(SettingsPage);
  private settingsGeneralPageInstance = lazyInit(SettingsGeneralPage);
  private speculosPageInstance = lazyInit(SpeculosPage);
  private stakePageInstance = lazyInit(StakePage);
  private evmStakePageInstance = lazyInit(EvmStakePage);
  private readonly tezosStakePageInstance = lazyInit(TezosStakePage);
  private swapLiveAppInstance = lazyInit(SwapLiveAppPage);
  private swapPageInstance = lazyInit(SwapPage);
  private mainNavigationPageInstance = lazyInit(MainNavigationPage);
  private myWalletPageInstance = lazyInit(MyWalletPage);
  private contactsPageInstance = lazyInit(ContactsPage);
  private operationPageInstance = lazyInit(OperationPage);
  private celoManageAssetsPageInstance = lazyInit(CeloManageAssetsPage);
  private readonly borrowPageInstance = lazyInit(BorrowPage);
  private buySellPageInstance = lazyInit(BuySellPage);
  private settingsHelpPageInstance = lazyInit(SettingsHelpPage);
  private readonly earnV2DashboardPageInstance = lazyInit(EarnV2DashboardPage);
  private modularDrawerPageInstance = lazyInit(ModularDrawer);
  private swapTransactionStatusDrawerInstance = lazyInit(SwapTransactionStatusDrawer);
  private readonly wallet40DrawersPageInstance = lazyInit(Wallet40DrawersPage);
  private readonly topBarSearchPageInstance = lazyInit(TopBarSearchPage);
  private undelegatePageInstance = lazyInit(UndelegatePage);

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

  public get trustchain() {
    return this.trustchainPageInstance();
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

  public get assetDetail() {
    return this.assetDetailPageInstance();
  }

  public get receive() {
    return this.receivePageInstance();
  }

  public get newSend() {
    return this.newSendFlowPageInstance();
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

  public get evmStake() {
    return this.evmStakePageInstance();
  }

  public get tezosStake() {
    return this.tezosStakePageInstance();
  }

  public get swap() {
    return this.swapPageInstance();
  }

  public get swapLiveApp() {
    return this.swapLiveAppInstance();
  }

  public get mainNavigation() {
    return this.mainNavigationPageInstance();
  }

  public get myWallet() {
    return this.myWalletPageInstance();
  }

  public get contacts() {
    return this.contactsPageInstance();
  }

  public get operation() {
    return this.operationPageInstance();
  }

  public get celoManageAssets() {
    return this.celoManageAssetsPageInstance();
  }

  public get buySell() {
    return this.buySellPageInstance();
  }

  public get settingsHelp() {
    return this.settingsHelpPageInstance();
  }

  public get earnV2Dashboard() {
    return this.earnV2DashboardPageInstance();
  }

  public get borrow() {
    return this.borrowPageInstance();
  }

  public get modularDrawer() {
    return this.modularDrawerPageInstance();
  }

  public get swapTransactionStatusDrawer() {
    return this.swapTransactionStatusDrawerInstance();
  }

  public get wallet40Drawers() {
    return this.wallet40DrawersPageInstance();
  }

  public get topBarSearch() {
    return this.topBarSearchPageInstance();
  }

  public get undelegate() {
    return this.undelegatePageInstance();
  }
}
