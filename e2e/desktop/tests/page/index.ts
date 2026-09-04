import { AccountPage } from "tests/page/account.page";
import { AccountsPage } from "tests/page/accounts.page";
import { AnalyticsPage } from "tests/page/analytics.page";
import { AddAccountModal } from "tests/page/modal/add.account.modal";
import { AssetDrawer } from "tests/page/drawer/asset.drawer";
import { AssetDetailPage } from "tests/page/assetDetail.page";
import { AssetPage } from "tests/page/asset.page";
import { BorrowPage } from "tests/page/borrow.page";
import { BuyAndSellPage } from "tests/page/buyAndSell.page";
import { DelegateDrawer } from "tests/page/drawer/delegate.drawer";
import { DelegateModal } from "tests/page/modal/delegate.modal";
import { EvmDelegateModal } from "tests/page/modal/evmDelegate.modal";
import { Drawer } from "tests/component/drawer.component";
import { EarnV2Page } from "tests/page/earn.v2.dashboard.page";
import { Layout } from "tests/component/layout.component";
import { LedgerSyncDrawer } from "tests/page/drawer/ledger.sync.drawer";
import { LiveApp } from "tests/page/liveApp.page";
import { LockscreenPage } from "tests/page/lockscreen.page";
import { MarketPage } from "tests/page/market.page";
import { Modal } from "tests/component/modal.component";
import { OnboardingPage } from "tests/page/onboarding.page";
import { OperationDrawer } from "tests/page/drawer/operation.drawer";
import { PageHolder } from "tests/page/abstractClasses";
import { PasswordlockModal } from "tests/page/modal/passwordlock.modal";
import { PortfolioPage } from "tests/page/portfolio.page";
import { ReceiveModal } from "tests/page/modal/receive.modal";
import { Redux } from "tests/utils/redux";
import { SendDrawer } from "tests/page/drawer/send.drawer";
import { SendModal } from "tests/page/modal/send.modal";
import { SettingsModal } from "tests/page/modal/settings.modal";
import { SettingsPage } from "tests/page/settings.page";
import { SpeculosPage } from "tests/page/speculos.page";
import { SwapConfirmationDrawer } from "tests/page/drawer/swap.confirmation.drawer";
import { SwapPage } from "tests/page/swap.page";
import { ModularScanAccountsDrawer } from "tests/page/drawer/modular.scan.accounts.drawer";
import { ModularDialog } from "tests/page/dialog/modular.dialog";
import { MarketBannerPage } from "tests/page/marketBanner.page";
import type { TrustchainPage } from "tests/page/trustchain.page";
import { MyWalletPage } from "tests/page/myWallet.page";
import { FearAndGreedDialog } from "tests/page/dialog/fearGreed.dialog";
import { NewSendModal } from "tests/page/modal/new.send.modal";
import { PrivateBalanceModal } from "tests/page/modal/private.balance.modal";
import { HistoryPage } from "tests/page/history.page";
import { MainNavigationPage } from "tests/page/mainNavigation.page";
import { SwapTransactionStatusDialog } from "tests/page/dialog/swap.transaction.status.dialog";
import { TezosStakeModal } from "tests/page/modal/tezos.stake.modal";
import { TezosEarningChoiceModal } from "tests/page/modal/tezos.earning.choice.modal";
import { TezosUnstakeModal } from "tests/page/modal/tezos.unstake.modal";
import { TezosUnstakeRequiredModal } from "tests/page/modal/tezos.unstake.required.modal";
import { UndelegateModal } from "tests/page/modal/undelegate.modal";
import { MarketCoinPage } from "tests/page/marketCoin.page";
import { CryptoAssetsPage } from "tests/page/cryptoAssets.page";
import { TopBarSearch } from "tests/page/topBarSearch.page";

export class Application extends PageHolder {
  public account = new AccountPage(this.page);
  public accounts = new AccountsPage(this.page);
  public analytics = new AnalyticsPage(this.page);
  public addAccount = new AddAccountModal(this.page);
  public assetDrawer = new AssetDrawer(this.page);
  public assetDetail = (assetId: string) => new AssetDetailPage(this.page, assetId);
  public assetPage = new AssetPage(this.page);
  public borrow = new BorrowPage(this.page, this.electronApp);
  public buyAndSell = new BuyAndSellPage(this.page, this.electronApp);
  public delegate = new DelegateModal(this.page);
  public evmDelegate = new EvmDelegateModal(this.page);
  public delegateDrawer = new DelegateDrawer(this.page);
  public drawer = new Drawer(this.page);
  public earnV2Dashboard = new EarnV2Page(this.page, this.electronApp);
  public layout = new Layout(this.page);
  public ledgerSync = new LedgerSyncDrawer(this.page);
  public liveApp = new LiveApp(this.page);
  public LockscreenPage = new LockscreenPage(this.page);
  public market = new MarketPage(this.page);
  public modal = new Modal(this.page);
  public modularDialog = new ModularDialog(this.page);
  public scanAccountsDrawer = new ModularScanAccountsDrawer(this.page);
  public onboarding = new OnboardingPage(this.page);
  public operationDrawer = new OperationDrawer(this.page);
  public password = new PasswordlockModal(this.page);
  public portfolio = new PortfolioPage(this.page);
  public receive = new ReceiveModal(this.page);
  public privateBalance = new PrivateBalanceModal(this.page);
  public redux = new Redux(this.page);
  public send = new SendModal(this.page);
  public newSendFlow = new NewSendModal(this.page);
  public sendDrawer = new SendDrawer(this.page);
  public settings = new SettingsPage(this.page);
  public settingsModal = new SettingsModal(this.page);
  public speculos = new SpeculosPage(this.page);
  public swap = new SwapPage(this.page, this.electronApp);
  public swapDrawer = new SwapConfirmationDrawer(this.page);
  public marketBanner = new MarketBannerPage(this.page);
  public myWallet = new MyWalletPage(this.page);
  public fearAndGreedDialog = new FearAndGreedDialog(this.page);
  public swapTransactionStatusDialog = new SwapTransactionStatusDialog(this.page);
  private trustchainPage: TrustchainPage | undefined;

  /**
   * Required on first use rather than imported at the top: the trustchain page pulls in the
   * key-ring and cloud-sync SDKs, which only the ledger sync suites need. A static import would
   * load that graph in every worker.
   */
  public get trustchain(): TrustchainPage {
    if (!this.trustchainPage) {
      const module: typeof import("./trustchain.page") = require("./trustchain.page");
      this.trustchainPage = new module.TrustchainPage();
    }
    return this.trustchainPage;
  }
  public history = new HistoryPage(this.page);
  public mainNavigation = new MainNavigationPage(this.page);
  public tezosStake = new TezosStakeModal(this.page);
  public tezosEarningChoice = new TezosEarningChoiceModal(this.page);
  public tezosUnstake = new TezosUnstakeModal(this.page);
  public tezosUnstakeRequired = new TezosUnstakeRequiredModal(this.page);
  public undelegate = new UndelegateModal(this.page);
  public marketCoin = new MarketCoinPage(this.page);
  public cryptoAssets = new CryptoAssetsPage(this.page, "cryptos");
  public stablecoinsAssets = new CryptoAssetsPage(this.page, "stablecoins");
  public topBarSearch = new TopBarSearch(this.page);
}
