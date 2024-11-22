import AccountPage from "./accounts/account.page";
import AccountsPage from "./accounts/accounts.page";
import AddAccountDrawer from "./accounts/addAccount.drawer";
import BuyDevicePage from "./discover/buyDevice.page";
import CommonPage from "./common.page";
import CryptoDrawer from "./liveApps/cryptoDrawer";
import CustomLockscreenPage from "./stax/customLockscreen.page";
import DiscoverPage from "./discover/discover.page";
import DummyWalletApp from "./liveApps/dummyWalletApp.webView";
import WalletAPIReceivePage from "./liveApps/walletAPIReceive";
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
import StakePage from "./trade/stake.page";
import SwapPage from "./trade/swap.page";
import TransfertMenuDrawer from "./wallet/transferMenu.drawer";
import WalletTabNavigatorPage from "./wallet/walletTabNavigator.page";

import type { Account } from "@ledgerhq/types-live";
import { DeviceLike } from "~/reducers/types";
import { loadAccounts, loadBleState, loadConfig } from "../bridge/server";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";

type ApplicationOptions = {
  speculosApp?: AppInfos;
  userdata?: string;
  knownDevices?: DeviceLike[];
  testAccounts?: Account[];
};

export class Application {
  public account = new AccountPage();
  public accounts = new AccountsPage();
  public addAccount = new AddAccountDrawer();
  public buyDevice = new BuyDevicePage();
  public common = new CommonPage();
  public cryptoDrawer = new CryptoDrawer();
  public customLockscreen = new CustomLockscreenPage();
  public discover = new DiscoverPage();
  public dummyWalletApp = new DummyWalletApp();
  public walletAPIReceive = new WalletAPIReceivePage();
  public manager = new ManagerPage();
  public market = new MarketPage();
  public nftGallery = new NftGalleryPage();
  public nftViewer = new NftViewerPage();
  public onboarding = new OnboardingStepsPage();
  public operationDetails = new OperationDetailsPage();
  public passwordEntry = new PasswordEntryPage();
  public portfolio = new PortfolioPage();
  public receive = new ReceivePage();
  public send = new SendPage();
  public settings = new SettingsPage();
  public settingsGeneral = new SettingsGeneralPage();
  public stake = new StakePage();
  public swap = new SwapPage();
  public transfertMenu = new TransfertMenuDrawer();
  public walletTabNavigator = new WalletTabNavigatorPage();

  static async init({ speculosApp, userdata, knownDevices, testAccounts }: ApplicationOptions) {
    const app = new Application();
    userdata && (await loadConfig(userdata, true));
    knownDevices && (await loadBleState({ knownDevices }));
    testAccounts && (await loadAccounts(testAccounts));
    speculosApp && (await app.common.addSpeculos(speculosApp.name));

    return app;
  }
}
