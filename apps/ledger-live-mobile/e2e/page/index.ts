import AssetAccountsPage from "./accounts/assetAccounts.page";
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
import StakePage from "./trade/stake.page";
import SwapPage from "./trade/swap.page";
import TransfertMenuDrawer from "./wallet/transferMenu.drawer";
import WalletTabNavigatorPage from "./wallet/walletTabNavigator.page";

import type { Account } from "@ledgerhq/types-live";
import { DeviceLike } from "~/reducers/types";
import { loadAccounts, loadBleState, loadConfig } from "../bridge/server";
import { AppInfos } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { lastValueFrom, Observable } from "rxjs";
import path from "path";
import fs from "fs";
import { getEnv } from "@ledgerhq/live-env";

type ApplicationOptions = {
  speculosApp?: AppInfos;
  cliCommands?: (() => Observable<unknown> | Promise<unknown> | string)[];
  userdata?: string;
  knownDevices?: DeviceLike[];
  testAccounts?: Account[];
};

export const getUserdataPath = (userdata: string) => {
  return path.resolve("e2e", "userdata", `${userdata}.json`);
};

export class Application {
  public userdataSpeculos: string | undefined = undefined;
  public userdataPath: string | undefined = undefined;
  public assetAccountsPage = new AssetAccountsPage();
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
  public ledgerSync = new LedgerSyncPage();
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

  constructor() {
    if (!getEnv("MOCK")) {
      // Create a temporary userdata file for Speculos tests
      const originalUserdata = "skip-onboarding";
      this.userdataSpeculos = `temp-userdata-${Date.now()}`;
      this.userdataPath = getUserdataPath(this.userdataSpeculos);
      const originalFilePath = getUserdataPath(originalUserdata);
      fs.copyFileSync(originalFilePath, this.userdataPath);
    }
  }

  async init({
    speculosApp,
    cliCommands,
    userdata,
    knownDevices,
    testAccounts,
  }: ApplicationOptions) {
    let proxyPort = 0;
    if (speculosApp) {
      proxyPort = await this.common.addSpeculos(speculosApp.name);
      process.env.DEVICE_PROXY_URL = `ws://localhost:${proxyPort}`;
      require("@ledgerhq/live-cli/src/live-common-setup");
    }

    if (cliCommands?.length) {
      for (const cmd of cliCommands) {
        const promise = await cmd();
        const result = promise instanceof Observable ? await lastValueFrom(promise) : await promise;
        // eslint-disable-next-line no-console
        console.log("CLI result: ", result);
      }
    }

    if (this.userdataSpeculos) await loadConfig(this.userdataSpeculos, true);
    else userdata && (await loadConfig(userdata, true));
    knownDevices && (await loadBleState({ knownDevices }));
    testAccounts && (await loadAccounts(testAccounts));

    const userdataSpeculosPath = getUserdataPath(this.userdataSpeculos!);
    if (fs.existsSync(userdataSpeculosPath)) fs.unlinkSync(userdataSpeculosPath);
  }
}
