import AssetAccountsPage from "./accounts/assetAccounts.page";
import AccountPage from "./accounts/account.page";
import AccountsPage from "./accounts/accounts.page";
import AddAccountDrawer from "./accounts/addAccount.drawer";
import BuyDevicePage from "./discover/buyDevice.page";
import CommonPage from "./common.page";
import CustomLockscreenPage from "./stax/customLockscreen.page";
import DeviceValidationPage from "./trade/deviceValidation.page";
import DiscoverPage from "./discover/discover.page";
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
import WalletTabNavigatorPage from "./wallet/walletTabNavigator.page";
import CeloManageAssetsPage from "./trade/celoManageAssets.page";

import { DeviceLike } from "~/reducers/types";
import { loadBleState, loadConfig, setFeatureFlags } from "../bridge/server";
import { isObservable, lastValueFrom, Observable } from "rxjs";
import path from "path";
import fs from "fs";
import { SettingsSetOverriddenFeatureFlagsPlayload } from "~/actions/types";
import { getEnv } from "@ledgerhq/live-env";
import { log } from "detox";
import { AppInfosType } from "@ledgerhq/live-common/e2e/enum/AppInfos";
import { setupEnvironment } from "../helpers/commonHelpers";

import { performance } from "perf_hooks";

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
  return path.resolve("userdata", `${userdata}.json`);
};

const lazyInit = <T>(PageClass: new () => T) => {
  let instance: T | null = null;
  return () => {
    if (!instance) instance = new PageClass();
    return instance;
  };
};

async function executeCliCommand(cmd: CliCommand, userdataPath?: string): Promise<unknown> {
  return await timeIt(`[CLI] executeCliCommand`, async () => {
    const resultOrPromise = await cmd(userdataPath);

    let result: unknown;

    try {
      if (isObservable(resultOrPromise)) {
        result = await lastValueFrom(resultOrPromise);
      } else {
        result = resultOrPromise;
      }
    } catch (err) {
      log.error("[CLI] ❌ Error executing command:", err);
      throw err;
    }

    log.info("[CLI] 🎉 Final result:", result);
    return result;
  });
}

async function timeIt<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result_1 = await fn();
  const duration = (performance.now() - start).toFixed(1);
  log.info(`[INIT] ${label} took ${duration}ms`);
  return result_1;
}

export class Application {
  private assetAccountsPageInstance = lazyInit(AssetAccountsPage);
  private accountPageInstance = lazyInit(AccountPage);
  private accountsPageInstance = lazyInit(AccountsPage);
  private addAccountDrawerInstance = lazyInit(AddAccountDrawer);
  private buyDevicePageInstance = lazyInit(BuyDevicePage);
  private commonPageInstance = lazyInit(CommonPage);
  private customLockscreenPageInstance = lazyInit(CustomLockscreenPage);
  private deviceValidationPageInstance = lazyInit(DeviceValidationPage);
  private discoverPageInstance = lazyInit(DiscoverPage);
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
  private walletTabNavigatorPageInstance = lazyInit(WalletTabNavigatorPage);
  private celoManageAssetsPageInstance = lazyInit(CeloManageAssetsPage);

  // public async init({
  //   speculosApp,
  //   cliCommands = [],
  //   cliCommandsOnApp = [],
  //   userdata,
  //   knownDevices,
  //   testedCurrencies,
  //   featureFlags,
  // }: ApplicationOptions) {
  //   const userdataSpeculos = `temp-userdata-${Date.now()}`;
  //   const userdataPath = getUserdataPath(userdataSpeculos);
  //
  //   // 0) prep user‑data
  //   if (!getEnv("MOCK")) {
  //     await timeIt("copy mock userdata", async () => {
  //       fs.copyFileSync(getUserdataPath(userdata || "skip-onboarding"), userdataPath);
  //     });
  //   }
  //
  //   // 1) parallel on‑app CLI commands
  //   await timeIt(`cliCommandsOnApp (${cliCommandsOnApp.length})`, async () => {
  //     for (let i = 0; i < cliCommandsOnApp.length; i++) {
  //       const { app, cmd } = cliCommandsOnApp[i];
  //       await timeIt(`onApp[${i}] ${app.name}`, async () => {
  //         const port = await this.common.addSpeculos(app.name);
  //         await executeCliCommand(cmd, userdataPath);
  //         await this.common.removeSpeculos(port);
  //       });
  //     }
  //   });
  //
  //   // 2) launch real speculos app
  //   if (speculosApp) {
  //     await timeIt(`addSpeculos(${speculosApp.name})`, () =>
  //       this.common.addSpeculos(speculosApp.name),
  //     );
  //   }
  //
  //   // 3) parallel global CLI commands
  //   await timeIt(`cliCommands (${cliCommands.length})`, async () => {
  //     for (let i = 0; i < cliCommands.length; i++) {
  //       await timeIt(`cliCommand[${i}]`, async () => {
  //         await executeCliCommand(cliCommands[i], userdataPath);
  //       });
  //     }
  //   });
  //
  //   // 4) bridge tasks in parallel
  //   const bridgeTasks: Array<Promise<unknown>> = [];
  //
  //   if (!getEnv("MOCK")) {
  //     bridgeTasks.push(
  //       timeIt("loadConfig+cleanup", async () => {
  //         await loadConfig(userdataSpeculos, true);
  //         fs.existsSync(userdataPath) && fs.unlinkSync(userdataPath);
  //       }),
  //     );
  //   } else if (userdata) {
  //     bridgeTasks.push(timeIt("loadConfig(mock)", () => loadConfig(userdata, true)));
  //   }
  //
  //   if (featureFlags) {
  //     bridgeTasks.push(timeIt("setFeatureFlags", () => setFeatureFlags(featureFlags)));
  //   }
  //
  //   if (knownDevices) {
  //     bridgeTasks.push(timeIt("loadBleState", () => loadBleState({ knownDevices })));
  //   }
  //
  //   // if (testedCurrencies) {
  //   //   this.testAccounts = initTestAccounts(testedCurrencies);
  //   //   bridgeTasks.push(timeIt("loadAccounts", () => loadAccounts(this.testAccounts)));
  //   // }
  //
  //   await timeIt(`bridge tasks (${bridgeTasks.length})`, () => Promise.all(bridgeTasks));
  // }

  public async init({
    speculosApp,
    cliCommands,
    cliCommandsOnApp,
    userdata,
    knownDevices,
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

  public get walletTabNavigator() {
    return this.walletTabNavigatorPageInstance();
  }

  public get celoManageAssets() {
    return this.celoManageAssetsPageInstance();
  }
}
