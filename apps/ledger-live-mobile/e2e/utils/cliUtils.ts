import bot from "@ledgerhq/live-cli/src/commands/blockchain/bot";
import botPortfolio from "@ledgerhq/live-cli/src/commands/blockchain/botPortfolio";
import botTransfer from "@ledgerhq/live-cli/src/commands/blockchain/botTransfer";
import broadcast from "@ledgerhq/live-cli/src/commands/blockchain/broadcast";
import confirmOp from "@ledgerhq/live-cli/src/commands/blockchain/confirmOp";
import derivation from "@ledgerhq/live-cli/src/commands/blockchain/derivation";
import estimateMaxSpendable from "@ledgerhq/live-cli/src/commands/blockchain/estimateMaxSpendable";
import generateTestScanAccounts from "@ledgerhq/live-cli/src/commands/blockchain/generateTestScanAccounts";
import generateTestTransaction from "@ledgerhq/live-cli/src/commands/blockchain/generateTestTransaction";
import getAddress from "@ledgerhq/live-cli/src/commands/blockchain/getAddress";
import getTransactionStatus from "@ledgerhq/live-cli/src/commands/blockchain/getTransactionStatus";
import receive from "@ledgerhq/live-cli/src/commands/blockchain/receive";
import satstack from "@ledgerhq/live-cli/src/commands/blockchain/satstack";
import satstackStatus from "@ledgerhq/live-cli/src/commands/blockchain/satstackStatus";
import scanDescriptors from "@ledgerhq/live-cli/src/commands/blockchain/scanDescriptors";
import send from "@ledgerhq/live-cli/src/commands/blockchain/send";
import signMessage from "@ledgerhq/live-cli/src/commands/blockchain/signMessage";
import sync from "@ledgerhq/live-cli/src/commands/blockchain/sync";
import testDetectOpCollision from "@ledgerhq/live-cli/src/commands/blockchain/testDetectOpCollision";
import testGetTrustedInputFromTxHash from "@ledgerhq/live-cli/src/commands/blockchain/testGetTrustedInputFromTxHash";
import app from "@ledgerhq/live-cli/src/commands/device/app";
import appUninstallAll from "@ledgerhq/live-cli/src/commands/device/appUninstallAll";
import appsCheckAllAppVersions from "@ledgerhq/live-cli/src/commands/device/appsCheckAllAppVersions";
import appsInstallAll from "@ledgerhq/live-cli/src/commands/device/appsInstallAll";
import appsUpdateTestAll from "@ledgerhq/live-cli/src/commands/device/appsUpdateTestAll";
import cleanSpeculos from "@ledgerhq/live-cli/src/commands/device/cleanSpeculos";
import customLockScreenFetch from "@ledgerhq/live-cli/src/commands/device/customLockScreenFetch";
import customLockScreenFetchAndRestore from "@ledgerhq/live-cli/src/commands/device/customLockScreenFetchAndRestore";
import customLockScreenFetchHash from "@ledgerhq/live-cli/src/commands/device/customLockScreenFetchHash";
import customLockScreenLoad from "@ledgerhq/live-cli/src/commands/device/customLockScreenLoad";
import customLockScreenRemove from "@ledgerhq/live-cli/src/commands/device/customLockScreenRemove";
import devDeviceAppsScenario from "@ledgerhq/live-cli/src/commands/device/devDeviceAppsScenario";
import deviceAppVersion from "@ledgerhq/live-cli/src/commands/device/deviceAppVersion";
import deviceInfo from "@ledgerhq/live-cli/src/commands/device/deviceInfo";
import deviceSDKFirmwareUpdate from "@ledgerhq/live-cli/src/commands/device/deviceSDKFirmwareUpdate";
import deviceSDKGetBatteryStatuses from "@ledgerhq/live-cli/src/commands/device/deviceSDKGetBatteryStatuses";
import deviceSDKGetDeviceInfo from "@ledgerhq/live-cli/src/commands/device/deviceSDKGetDeviceInfo";
import deviceSDKToggleOnboardingEarlyCheck from "@ledgerhq/live-cli/src/commands/device/deviceSDKToggleOnboardingEarlyCheck";
import deviceVersion from "@ledgerhq/live-cli/src/commands/device/deviceVersion";
import discoverDevices from "@ledgerhq/live-cli/src/commands/device/discoverDevices";
import firmwareRepair from "@ledgerhq/live-cli/src/commands/device/firmwareRepair";
import firmwareUpdate from "@ledgerhq/live-cli/src/commands/device/firmwareUpdate";
import genuineCheck from "@ledgerhq/live-cli/src/commands/device/genuineCheck";
import getBatteryStatus from "@ledgerhq/live-cli/src/commands/device/getBatteryStatus";
import getDeviceRunningMode from "@ledgerhq/live-cli/src/commands/device/getDeviceRunningMode";
import i18n from "@ledgerhq/live-cli/src/commands/device/i18n";
import listApps from "@ledgerhq/live-cli/src/commands/device/listApps";
import managerListApps from "@ledgerhq/live-cli/src/commands/device/managerListApps";
import proxy from "@ledgerhq/live-cli/src/commands/device/proxy";
import reinstallConfigurationConsent from "@ledgerhq/live-cli/src/commands/device/reinstallConfigurationConsent";
import repl from "@ledgerhq/live-cli/src/commands/device/repl";
import speculosList from "@ledgerhq/live-cli/src/commands/device/speculosList";
import balanceHistory from "@ledgerhq/live-cli/src/commands/live/balanceHistory";
import countervalues from "@ledgerhq/live-cli/src/commands/live/countervalues";
import envs from "@ledgerhq/live-cli/src/commands/live/envs";
import exportAccounts from "@ledgerhq/live-cli/src/commands/live/exportAccounts";
import ledgerKeyRingProtocol from "@ledgerhq/live-cli/src/commands/live/ledgerKeyRingProtocol";
import ledgerSync from "@ledgerhq/live-cli/src/commands/live/ledgerSync";
import liveData from "@ledgerhq/live-cli/src/commands/live/liveData";
import portfolio from "@ledgerhq/live-cli/src/commands/live/portfolio";
import synchronousOnboarding from "@ledgerhq/live-cli/src/commands/live/synchronousOnboarding";
import user from "@ledgerhq/live-cli/src/commands/live/user";
import version from "@ledgerhq/live-cli/src/commands/live/version";
import swap from "@ledgerhq/live-cli/src/commands/ptx/swap";

export const CLI = {
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
