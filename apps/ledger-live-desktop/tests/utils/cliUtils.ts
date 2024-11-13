import bot, { BotJobOpts } from "@ledgerhq/live-cli/src/commands/blockchain/bot";
import botPortfolio, {
  BotPortfolioJobOpts,
} from "@ledgerhq/live-cli/src/commands/blockchain/botPortfolio";
import botTransfer from "@ledgerhq/live-cli/src/commands/blockchain/botTransfer";
import broadcast, { BroadcastJobOpts } from "@ledgerhq/live-cli/src/commands/blockchain/broadcast";
import confirmOp, { ConfirmOpJobOpts } from "@ledgerhq/live-cli/src/commands/blockchain/confirmOp";
import derivation from "@ledgerhq/live-cli/src/commands/blockchain/derivation";
import estimateMaxSpendable, {
  EstimateMaxSpendableJobOpts,
} from "@ledgerhq/live-cli/src/commands/blockchain/estimateMaxSpendable";
import generateTestScanAccounts, {
  GenerateTestScanAccountsJobOpts,
} from "@ledgerhq/live-cli/src/commands/blockchain/generateTestScanAccounts";
import generateTestTransaction, {
  GenerateTestTransactionJobOpts,
} from "@ledgerhq/live-cli/src/commands/blockchain/generateTestTransaction";
import getAddress, {
  GetAddressJobOpts,
} from "@ledgerhq/live-cli/src/commands/blockchain/getAddress";
import getTransactionStatus, {
  GetTransactionStatusJobOpts,
} from "@ledgerhq/live-cli/src/commands/blockchain/getTransactionStatus";
import receive, { ReceiveJobOpts } from "@ledgerhq/live-cli/src/commands/blockchain/receive";
import satstack, { SatstackJobOpts } from "@ledgerhq/live-cli/src/commands/blockchain/satstack";
import satstackStatus, {
  SatstackStatusJobOpts,
} from "@ledgerhq/live-cli/src/commands/blockchain/satstackStatus";
import scanDescriptors, {
  ScanDescriptorsJobOpts,
} from "@ledgerhq/live-cli/src/commands/blockchain/scanDescriptors";
import send, { SendJobOpts } from "@ledgerhq/live-cli/src/commands/blockchain/send";
import signMessage, {
  SignMessageJobOpts,
} from "@ledgerhq/live-cli/src/commands/blockchain/signMessage";
import sync, { SyncJobOpts } from "@ledgerhq/live-cli/src/commands/blockchain/sync";
import testDetectOpCollision, {
  TestDetectOpCollisionJobOpts,
} from "@ledgerhq/live-cli/src/commands/blockchain/testDetectOpCollision";
import testGetTrustedInputFromTxHash, {
  TestGetTrustedInputFromTxHashJobOpts,
} from "@ledgerhq/live-cli/src/commands/blockchain/testGetTrustedInputFromTxHash";
import app, { AppJobOpts } from "@ledgerhq/live-cli/src/commands/device/app";
import appUninstallAll, {
  AppsUninstallAllJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/appUninstallAll";
import appsCheckAllAppVersions, {
  AppsCheckAllAppVersionsJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/appsCheckAllAppVersions";
import appsInstallAll, {
  AppsInstallAllJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/appsInstallAll";
import appsUpdateTestAll, {
  AppsUpdateTestAllJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/appsUpdateTestAll";
import cleanSpeculos from "@ledgerhq/live-cli/src/commands/device/cleanSpeculos";
import customLockScreenFetch, {
  CustomLockScreenFetchJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/customLockScreenFetch";
import customLockScreenFetchAndRestore, {
  CustomLockScreenFetchAndRestoreJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/customLockScreenFetchAndRestore";
import customLockScreenFetchHash, {
  CustomLockScreenFetchHashJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/customLockScreenFetchHash";
import customLockScreenLoad, {
  CustomLockScreenLoadJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/customLockScreenLoad";
import customLockScreenRemove, {
  CustomLockScreenRemoveJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/customLockScreenRemove";
import devDeviceAppsScenario, {
  DevDeviceAppsScenarioJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/devDeviceAppsScenario";
import deviceAppVersion, {
  DeviceAppVersionJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/deviceAppVersion";
import deviceInfo, { DeviceInfoJobOpts } from "@ledgerhq/live-cli/src/commands/device/deviceInfo";
import deviceSDKFirmwareUpdate, {
  DeviceSDKFirmwareUpdateJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/deviceSDKFirmwareUpdate";
import deviceSDKGetBatteryStatuses, {
  DeviceSDKGetBatteryStatusesJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/deviceSDKGetBatteryStatuses";
import deviceSDKGetDeviceInfo, {
  DeviceSDKGetDeviceInfoJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/deviceSDKGetDeviceInfo";
import deviceSDKToggleOnboardingEarlyCheck, {
  DeviceSDKToggleOnboardingEarlyCheckJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/deviceSDKToggleOnboardingEarlyCheck";
import deviceVersion, {
  DeviceVersionJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/deviceVersion";
import discoverDevices, {
  DiscoverDevicesJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/discoverDevices";
import firmwareRepair, {
  FirmwareRepairJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/firmwareRepair";
import firmwareUpdate, {
  FirmwareUpdateJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/firmwareUpdate";
import genuineCheck, {
  GenuineCheckJobArgs,
} from "@ledgerhq/live-cli/src/commands/device/genuineCheck";
import getBatteryStatus, {
  GetBatteryStatusJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/getBatteryStatus";
import getDeviceRunningMode, {
  GetDeviceRunningModeJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/getDeviceRunningMode";
import i18n, { I18nJobOpts } from "@ledgerhq/live-cli/src/commands/device/i18n";
import listApps, { ListAppsJobOpts } from "@ledgerhq/live-cli/src/commands/device/listApps";
import managerListApps, {
  ManagerListAppsJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/managerListApps";
import proxy, { ProxyJobOpts } from "@ledgerhq/live-cli/src/commands/device/proxy";
import reinstallConfigurationConsent, {
  ReinstallConfigurationConsentJobOpts,
} from "@ledgerhq/live-cli/src/commands/device/reinstallConfigurationConsent";
import repl, { ReplJobOpts } from "@ledgerhq/live-cli/src/commands/device/repl";
import speculosList from "@ledgerhq/live-cli/src/commands/device/speculosList";
import balanceHistory, {
  BalanceHistoryJobOpts,
} from "@ledgerhq/live-cli/src/commands/live/balanceHistory";
import countervalues, {
  CountervaluesJobOpts,
} from "@ledgerhq/live-cli/src/commands/live/countervalues";
import envs from "@ledgerhq/live-cli/src/commands/live/envs";
import exportAccounts, {
  ExportAccountsJobOpts,
} from "@ledgerhq/live-cli/src/commands/live/exportAccounts";
import ledgerKeyRingProtocol, {
  LedgerKeyRingProtocolJobOpts,
} from "@ledgerhq/live-cli/src/commands/live/ledgerKeyRingProtocol";
import ledgerSync, { LedgerSyncJobOpts } from "@ledgerhq/live-cli/src/commands/live/ledgerSync";
import liveData, { LiveDataJobOpts } from "@ledgerhq/live-cli/src/commands/live/liveData";
import portfolio, { PortfolioJobOpts } from "@ledgerhq/live-cli/src/commands/live/portfolio";
import synchronousOnboarding, {
  SynchronousOnboardingJobOpts,
} from "@ledgerhq/live-cli/src/commands/live/synchronousOnboarding";
import user from "@ledgerhq/live-cli/src/commands/live/user";
import version from "@ledgerhq/live-cli/src/commands/live/version";
import swap, { SwapJobOpts } from "@ledgerhq/live-cli/src/commands/ptx/swap";
import { Observable } from "rxjs";

export type Command<JobOpts> = (arg: JobOpts) => Observable<any> | Promise<any> | string; // Job accepts a single object
type EmtyArgs = {};

export type Commands = {
  bot: Command<BotJobOpts>;
  botPortfolio: Command<BotPortfolioJobOpts>;
  botTransfer: Command<EmtyArgs>;
  broadcast: Command<BroadcastJobOpts>;
  confirmOp: Command<ConfirmOpJobOpts>;
  derivation: Command<EmtyArgs>;
  estimateMaxSpendable: Command<EstimateMaxSpendableJobOpts>;
  generateTestScanAccounts: Command<GenerateTestScanAccountsJobOpts>;
  generateTestTransaction: Command<GenerateTestTransactionJobOpts>;
  getAddress: Command<GetAddressJobOpts>;
  getTransactionStatus: Command<GetTransactionStatusJobOpts>;
  receive: Command<ReceiveJobOpts>;
  satstack: Command<SatstackJobOpts>;
  satstackStatus: Command<SatstackStatusJobOpts>;
  scanDescriptors: Command<ScanDescriptorsJobOpts>;
  send: Command<SendJobOpts>;
  signMessage: Command<SignMessageJobOpts>;
  sync: Command<SyncJobOpts>;
  testDetectOpCollision: Command<TestDetectOpCollisionJobOpts>;
  testGetTrustedInputFromTxHash: Command<TestGetTrustedInputFromTxHashJobOpts>;
  app: Command<AppJobOpts>;
  appUninstallAll: Command<AppsUninstallAllJobOpts>;
  appsCheckAllAppVersions: Command<AppsCheckAllAppVersionsJobOpts>;
  appsInstallAll: Command<AppsInstallAllJobOpts>;
  appsUpdateTestAll: Command<AppsUpdateTestAllJobOpts>;
  cleanSpeculos: Command<EmtyArgs>;
  customLockScreenFetch: Command<CustomLockScreenFetchJobOpts>;
  customLockScreenFetchAndRestore: Command<CustomLockScreenFetchAndRestoreJobOpts>;
  customLockScreenFetchHash: Command<CustomLockScreenFetchHashJobOpts>;
  customLockScreenLoad: Command<CustomLockScreenLoadJobOpts>;
  customLockScreenRemove: Command<CustomLockScreenRemoveJobOpts>;
  devDeviceAppsScenario: Command<DevDeviceAppsScenarioJobOpts>;
  deviceAppVersion: Command<DeviceAppVersionJobOpts>;
  deviceInfo: Command<DeviceInfoJobOpts>;
  deviceSDKFirmwareUpdate: Command<DeviceSDKFirmwareUpdateJobOpts>;
  deviceSDKGetBatteryStatuses: Command<DeviceSDKGetBatteryStatusesJobOpts>;
  deviceSDKGetDeviceInfo: Command<DeviceSDKGetDeviceInfoJobOpts>;
  deviceSDKToggleOnboardingEarlyCheck: Command<DeviceSDKToggleOnboardingEarlyCheckJobOpts>;
  deviceVersion: Command<DeviceVersionJobOpts>;
  discoverDevices: Command<DiscoverDevicesJobOpts>;
  firmwareRepair: Command<FirmwareRepairJobOpts>;
  firmwareUpdate: Command<FirmwareUpdateJobOpts>;
  genuineCheck: Command<GenuineCheckJobArgs>;
  getBatteryStatus: Command<GetBatteryStatusJobOpts>;
  getDeviceRunningMode: Command<GetDeviceRunningModeJobOpts>;
  i18n: Command<I18nJobOpts>;
  listApps: Command<ListAppsJobOpts>;
  managerListApps: Command<ManagerListAppsJobOpts>;
  proxy: Command<ProxyJobOpts>;
  reinstallConfigurationConsent: Command<ReinstallConfigurationConsentJobOpts>;
  repl: Command<ReplJobOpts>;
  speculosList: Command<EmtyArgs>;
  balanceHistory: Command<BalanceHistoryJobOpts>;
  countervalues: Command<CountervaluesJobOpts>;
  envs: Command<EmtyArgs>;
  exportAccounts: Command<ExportAccountsJobOpts>;
  ledgerKeyRingProtocol: Command<LedgerKeyRingProtocolJobOpts>;
  ledgerSync: Command<LedgerSyncJobOpts>;
  liveData: Command<LiveDataJobOpts>;
  portfolio: Command<PortfolioJobOpts>;
  synchronousOnboarding: Command<SynchronousOnboardingJobOpts>;
  user: Command<EmtyArgs>;
  version: Command<EmtyArgs>;
  swap: Command<SwapJobOpts>;
};

export const commandCLI = {
  bot: bot.job,
  botPortfolio: botPortfolio.job,
  botTransfer: botTransfer.job,
  broadcast: broadcast.job,
  confirmOp: confirmOp.job,
  derivation: derivation.job,
  estimateMaxSpendable: estimateMaxSpendable.job,
  generateTestScanAccounts: generateTestScanAccounts.job,
  generateTestTransaction: generateTestTransaction.job,
  getAddress: getAddress.job,
  getTransactionStatus: getTransactionStatus.job,
  receive: receive.job,
  satstack: satstack.job,
  satstackStatus: satstackStatus.job,
  scanDescriptors: scanDescriptors.job,
  send: send.job,
  signMessage: signMessage.job,
  sync: sync.job,
  testDetectOpCollision: testDetectOpCollision.job,
  testGetTrustedInputFromTxHash: testGetTrustedInputFromTxHash.job,
  app: app.job,
  appUninstallAll: appUninstallAll.job,
  appsCheckAllAppVersions: appsCheckAllAppVersions.job,
  appsInstallAll: appsInstallAll.job,
  appsUpdateTestAll: appsUpdateTestAll.job,
  cleanSpeculos: cleanSpeculos.job,
  customLockScreenFetch: customLockScreenFetch.job,
  customLockScreenFetchAndRestore: customLockScreenFetchAndRestore.job,
  customLockScreenFetchHash: customLockScreenFetchHash.job,
  customLockScreenLoad: customLockScreenLoad.job,
  customLockScreenRemove: customLockScreenRemove.job,
  devDeviceAppsScenario: devDeviceAppsScenario.job,
  deviceAppVersion: deviceAppVersion.job,
  deviceInfo: deviceInfo.job,
  deviceSDKFirmwareUpdate: deviceSDKFirmwareUpdate.job,
  deviceSDKGetBatteryStatuses: deviceSDKGetBatteryStatuses.job,
  deviceSDKGetDeviceInfo: deviceSDKGetDeviceInfo.job,
  deviceSDKToggleOnboardingEarlyCheck: deviceSDKToggleOnboardingEarlyCheck.job,
  deviceVersion: deviceVersion.job,
  discoverDevices: discoverDevices.job,
  firmwareRepair: firmwareRepair.job,
  firmwareUpdate: firmwareUpdate.job,
  genuineCheck: genuineCheck.job,
  getBatteryStatus: getBatteryStatus.job,
  getDeviceRunningMode: getDeviceRunningMode.job,
  i18n: i18n.job,
  listApps: listApps.job,
  managerListApps: managerListApps.job,
  proxy: proxy.job,
  reinstallConfigurationConsent: reinstallConfigurationConsent.job,
  repl: repl.job,
  speculosList: speculosList.job,
  balanceHistory: balanceHistory.job,
  countervalues: countervalues.job,
  envs: envs.job,
  exportAccounts: exportAccounts.job,
  ledgerKeyRingProtocol: ledgerKeyRingProtocol.job,
  ledgerSync: ledgerSync.job,
  liveData: liveData.job,
  portfolio: portfolio.job,
  synchronousOnboarding: synchronousOnboarding.job,
  user: user.job,
  version: version.job,
  swap: swap.job,
};
