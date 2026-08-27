import { Step } from "jest-allure2-reporter/api";
import AssetAccountsPage from "page/accounts/assetAccounts.page";
import AccountPage from "page/accounts/account.page";
import AccountsPage from "page/accounts/accounts.page";
import AddAccountDrawer from "page/accounts/addAccount.drawer";
import CommonPage from "page/common.page";
import CustomLockscreenPage from "page/stax/customLockscreen.page";
import DeviceValidationPage from "page/trade/deviceValidation.page";
import DiscoverPage from "page/discover/discover.page";
import LedgerSyncPage from "page/settings/ledgerSync.page";
import ManagerPage from "page/manager/manager.page";
import MarketPage from "page/market/market.page";
import OnboardingStepsPage from "page/onboarding/onboardingSteps.page";
import OperationDetailsPage from "page/trade/operationDetails.page";
import PasswordEntryPage from "page/passwordEntry.page";
import PortfolioEmptyStatePage from "page/wallet/portfolioEmptyState.page";
import PortfolioPage from "page/wallet/portfolio.page";
import AssetDetailPage from "page/wallet/assetDetail.page";
import ReceivePage from "page/trade/receive.page";
import NewSendFlowPage from "page/trade/newSendFlow.page";
import SendPage from "page/trade/send.page";
import SettingsGeneralPage from "page/settings/settingsGeneral.page";
import SettingsHelpPage from "page/settings/settingsHelp.page";
import SettingsPage from "page/settings/settings.page";
import SpeculosPage from "page/speculos.page";
import StakePage from "page/trade/stake.page";
import EvmStakePage from "page/trade/evmStake.page";
import TezosStakePage from "page/trade/tezosStake.page";
import SwapPage from "page/trade/swap.page";
import SwapLiveAppPage from "page/liveApps/swapLiveApp";
import MainNavigationPage from "page/wallet/mainNavigation.page";
import MyWalletPage from "page/wallet/myWallet.page";
import ContactsPage from "page/wallet/contacts.page";
import OperationPage from "page/wallet/operation.page";
import TopBarSearchPage from "page/wallet/topBarSearch.page";
import CeloManageAssetsPage from "page/trade/celoManageAssets.page";
import BorrowPage from "page/trade/borrow.page";
import TransferMenuDrawer from "page/wallet/transferMenu.drawer";
import BuySellPage from "page/trade/buySell.page";
import EarnV2DashboardPage from "page/trade/earnV2Dashboard.page";
import ModularDrawer from "page/drawer/modular.drawer";
import SwapTransactionStatusDrawer from "page/drawer/swapTransactionStatus.drawer";
import UndelegatePage from "page/trade/undelegate.page";
import Wallet40DrawersPage from "page/drawer/wallet40Drawers.drawer";

import path from "path";
import fs from "fs";
import { InitializationManager, InitOptions } from "utils/initUtil";
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
  private managerPageInstance = lazyInit(ManagerPage);
  private marketPageInstance = lazyInit(MarketPage);
  private onboardingPageInstance = lazyInit(OnboardingStepsPage);
  private operationDetailsPageInstance = lazyInit(OperationDetailsPage);
  private passwordEntryPageInstance = lazyInit(PasswordEntryPage);
  private portfolioEmptyStatePageInstance = lazyInit(PortfolioEmptyStatePage);
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
  private TransferMenuDrawerInstance = lazyInit(TransferMenuDrawer);
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

  public get portfolioEmptyState() {
    return this.portfolioEmptyStatePageInstance();
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

  public get transferMenuDrawer() {
    return this.TransferMenuDrawerInstance();
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
