import bot from "./commands/blockchain/bot";
import botPortfolio from "./commands/blockchain/botPortfolio";
import botTransfer from "./commands/blockchain/botTransfer";
import broadcast from "./commands/blockchain/broadcast";
import confirmOp from "./commands/blockchain/confirmOp";
import derivation from "./commands/blockchain/derivation";
import estimateMaxSpendable from "./commands/blockchain/estimateMaxSpendable";
import generateTestScanAccounts from "./commands/blockchain/generateTestScanAccounts";
import generateTestTransaction from "./commands/blockchain/generateTestTransaction";
import getAddress from "./commands/blockchain/getAddress";
import getTransactionStatus from "./commands/blockchain/getTransactionStatus";
import receive from "./commands/blockchain/receive";
import satstack from "./commands/blockchain/satstack";
import satstackStatus from "./commands/blockchain/satstackStatus";
import scanDescriptors from "./commands/blockchain/scanDescriptors";
import send from "./commands/blockchain/send";
import signMessage from "./commands/blockchain/signMessage";
import sync from "./commands/blockchain/sync";
import testDetectOpCollision from "./commands/blockchain/testDetectOpCollision";
import testGetTrustedInputFromTxHash from "./commands/blockchain/testGetTrustedInputFromTxHash";
import app from "./commands/device/app";
import appUninstallAll from "./commands/device/appUninstallAll";
import appsCheckAllAppVersions from "./commands/device/appsCheckAllAppVersions";
import appsInstallAll from "./commands/device/appsInstallAll";
import appsUpdateTestAll from "./commands/device/appsUpdateTestAll";
import cleanSpeculos from "./commands/device/cleanSpeculos";
import devDeviceAppsScenario from "./commands/device/devDeviceAppsScenario";
import deviceAppVersion from "./commands/device/deviceAppVersion";
import deviceInfo from "./commands/device/deviceInfo";
import deviceSDKFirmwareUpdate from "./commands/device/deviceSDKFirmwareUpdate";
import deviceSDKGetBatteryStatuses from "./commands/device/deviceSDKGetBatteryStatuses";
import deviceSDKGetDeviceInfo from "./commands/device/deviceSDKGetDeviceInfo";
import deviceSDKToggleOnboardingEarlyCheck from "./commands/device/deviceSDKToggleOnboardingEarlyCheck";
import deviceVersion from "./commands/device/deviceVersion";
import discoverDevices from "./commands/device/discoverDevices";
import firmwareRepair from "./commands/device/firmwareRepair";
import firmwareUpdate from "./commands/device/firmwareUpdate";
import genuineCheck from "./commands/device/genuineCheck";
import getBatteryStatus from "./commands/device/getBatteryStatus";
import getDeviceRunningMode from "./commands/device/getDeviceRunningMode";
import i18n from "./commands/device/i18n";
import listApps from "./commands/device/listApps";
import managerListApps from "./commands/device/managerListApps";
import proxy from "./commands/device/proxy";
import repl from "./commands/device/repl";
import speculosList from "./commands/device/speculosList";
import staxFetchAndRestoreDemo from "./commands/device/staxFetchAndRestoreDemo";
import staxFetchImage from "./commands/device/staxFetchImage";
import staxFetchImageHash from "./commands/device/staxFetchImageHash";
import staxLoadImage from "./commands/device/staxLoadImage";
import staxRemoveImage from "./commands/device/staxRemoveImage";
import balanceHistory from "./commands/live/balanceHistory";
import countervalues from "./commands/live/countervalues";
import envs from "./commands/live/envs";
import exportAccounts from "./commands/live/exportAccounts";
import liveData from "./commands/live/liveData";
import portfolio from "./commands/live/portfolio";
import synchronousOnboarding from "./commands/live/synchronousOnboarding";
import user from "./commands/live/user";
import version from "./commands/live/version";
import swap from "./commands/ptx/swap";

export default {
  bot,
  botPortfolio,
  botTransfer,
  broadcast,
  confirmOp,
  derivation,
  estimateMaxSpendable,
  generateTestScanAccounts,
  generateTestTransaction,
  getAddress,
  getTransactionStatus,
  receive,
  satstack,
  satstackStatus,
  scanDescriptors,
  send,
  signMessage,
  sync,
  testDetectOpCollision,
  testGetTrustedInputFromTxHash,
  app,
  appUninstallAll,
  appsCheckAllAppVersions,
  appsInstallAll,
  appsUpdateTestAll,
  cleanSpeculos,
  devDeviceAppsScenario,
  deviceAppVersion,
  deviceInfo,
  deviceSDKFirmwareUpdate,
  deviceSDKGetBatteryStatuses,
  deviceSDKGetDeviceInfo,
  deviceSDKToggleOnboardingEarlyCheck,
  deviceVersion,
  discoverDevices,
  firmwareRepair,
  firmwareUpdate,
  genuineCheck,
  getBatteryStatus,
  getDeviceRunningMode,
  i18n,
  listApps,
  managerListApps,
  proxy,
  repl,
  speculosList,
  staxFetchAndRestoreDemo,
  staxFetchImage,
  staxFetchImageHash,
  staxLoadImage,
  staxRemoveImage,
  balanceHistory,
  countervalues,
  envs,
  exportAccounts,
  liveData,
  portfolio,
  synchronousOnboarding,
  user,
  version,
  swap,
};
