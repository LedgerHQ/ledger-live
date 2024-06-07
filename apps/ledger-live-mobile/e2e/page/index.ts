import AccountPage from "./accounts/account.page";
import AccountsPage from "./accounts/accounts.page";
import AddAccountDrawer from "./accounts/addAccount.drawer";
import CommonPage from "./common.page";
import CryptoDrawer from "./liveApps/cryptoDrawer";
import CustomLockscreenPage from "./stax/customLockscreen.page";
import DiscoverPage from "./discover/discover.page";
import SettingsGeneralPage from "./settings/settingsGeneral.page";
import BuyDevicePage from "./discover/buyDevice.page";
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
import SettingsPage from "./settings/settings.page";
import StakePage from "./trade/stake.page";
import SwapPage from "./trade/swap.page";
import WalletTabNavigatorPage from "./wallet/walletTabNavigator.page";

import DeviceAction from "../models/DeviceAction";
import { knownDevice } from "../models/devices";

export class Application {
  public account = new AccountPage();
  public accounts = new AccountsPage();
  public addAccount = new AddAccountDrawer();
  public common = new CommonPage();
  public cryptoDrawer = new CryptoDrawer();
  public customLockscreen = new CustomLockscreenPage();
  public discover = new DiscoverPage();
  public settingsGeneral = new SettingsGeneralPage();
  public buyDevice = new BuyDevicePage();
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
  public stake = new StakePage();
  public swap = new SwapPage();
  public walletTabNavigator = new WalletTabNavigatorPage();
}

export const Device = (device = knownDevice) => new DeviceAction(device);
