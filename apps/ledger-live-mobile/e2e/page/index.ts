import AccountPage from "./accounts/account.page";
import AccountsPage from "./accounts/accounts.page";
import AddAccountDrawer from "./accounts/addAccount.drawer";
import BuyDevicePage from "./discover/buyDevice.page";
import CommonPage from "./common.page";
import CryptoDrawer from "./liveApps/cryptoDrawer";
import CustomLockscreenPage from "./stax/customLockscreen.page";
import DiscoverPage from "./discover/discover.page";
import LiveAppWebview from "./liveApps/liveAppWebview";
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
import WalletTabNavigatorPage from "./wallet/walletTabNavigator.page";

import type { Account } from "@ledgerhq/types-live";
import { DeviceLike } from "~/reducers/types";
import { loadAccounts, loadBleState, loadConfig } from "../bridge/server";

export class Application {
  public account = new AccountPage();
  public accounts = new AccountsPage();
  public addAccount = new AddAccountDrawer();
  public buyDevice = new BuyDevicePage();
  public common = new CommonPage();
  public cryptoDrawer = new CryptoDrawer();
  public customLockscreen = new CustomLockscreenPage();
  public discover = new DiscoverPage();
  public liveAppWebview = new LiveAppWebview();
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
  public walletTabNavigator = new WalletTabNavigatorPage();

  static async init(userdata?: string, knownDevices?: DeviceLike[], testAccounts?: Account[]) {
    const app = new Application();
    if (userdata) await loadConfig(userdata, true);
    if (knownDevices) await loadBleState({ knownDevices: knownDevices });
    if (testAccounts) await loadAccounts(testAccounts);

    return app;
  }
}
