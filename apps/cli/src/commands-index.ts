import app from "./commands/app";
import appUninstallAll from "./commands/appUninstallAll";
import appsCheckAllAppVersions from "./commands/appsCheckAllAppVersions";
import appsInstallAll from "./commands/appsInstallAll";
import appsUpdateTestAll from "./commands/appsUpdateTestAll";
import balanceHistory from "./commands/balanceHistory";
import bot from "./commands/bot";
import botPortfolio from "./commands/botPortfolio";
import botTransfer from "./commands/botTransfer";
import broadcast from "./commands/broadcast";
import cleanSpeculos from "./commands/cleanSpeculos";
import confirmOp from "./commands/confirmOp";
import countervalues from "./commands/countervalues";
import derivation from "./commands/derivation";
import devDeviceAppsScenario from "./commands/devDeviceAppsScenario";
import deviceAppVersion from "./commands/deviceAppVersion";
import deviceInfo from "./commands/deviceInfo";
import deviceSDKFirmwareUpdate from "./commands/deviceSDKFirmwareUpdate";
import deviceSDKGetDeviceInfo from "./commands/deviceSDKGetDeviceInfo";
import deviceVersion from "./commands/deviceVersion";
import discoverDevices from "./commands/discoverDevices";
import envs from "./commands/envs";
import estimateMaxSpendable from "./commands/estimateMaxSpendable";
import exportAccounts from "./commands/exportAccounts";
import firmwareRepair from "./commands/firmwareRepair";
import firmwareUpdate from "./commands/firmwareUpdate";
import generateTestScanAccounts from "./commands/generateTestScanAccounts";
import generateTestTransaction from "./commands/generateTestTransaction";
import genuineCheck from "./commands/genuineCheck";
import getAddress from "./commands/getAddress";
import getBatteryStatus from "./commands/getBatteryStatus";
import getDeviceRunningMode from "./commands/getDeviceRunningMode";
import getTransactionStatus from "./commands/getTransactionStatus";
import i18n from "./commands/i18n";
import liveData from "./commands/liveData";
import managerListApps from "./commands/managerListApps";
import portfolio from "./commands/portfolio";
import proxy from "./commands/proxy";
import receive from "./commands/receive";
import repl from "./commands/repl";
import satstack from "./commands/satstack";
import satstackStatus from "./commands/satstackStatus";
import scanDescriptors from "./commands/scanDescriptors";
import send from "./commands/send";
import signMessage from "./commands/signMessage";
import speculosList from "./commands/speculosList";
import staxFetchAndRestoreDemo from "./commands/staxFetchAndRestoreDemo";
import staxFetchImage from "./commands/staxFetchImage";
import staxFetchImageHash from "./commands/staxFetchImageHash";
import staxLoadImage from "./commands/staxLoadImage";
import swap from "./commands/swap";
import sync from "./commands/sync";
import synchronousOnboarding from "./commands/synchronousOnboarding";
import testDetectOpCollision from "./commands/testDetectOpCollision";
import testGetTrustedInputFromTxHash from "./commands/testGetTrustedInputFromTxHash";
import user from "./commands/user";
import version from "./commands/version";
import walletconnect from "./commands/walletconnect";

export default {
  app,
  appUninstallAll,
  appsCheckAllAppVersions,
  appsInstallAll,
  appsUpdateTestAll,
  balanceHistory,
  bot,
  botPortfolio,
  botTransfer,
  broadcast,
  cleanSpeculos,
  confirmOp,
  countervalues,
  derivation,
  devDeviceAppsScenario,
  deviceAppVersion,
  deviceInfo,
  deviceSDKFirmwareUpdate,
  deviceSDKGetDeviceInfo,
  deviceVersion,
  discoverDevices,
  envs,
  estimateMaxSpendable,
  exportAccounts,
  firmwareRepair,
  firmwareUpdate,
  generateTestScanAccounts,
  generateTestTransaction,
  genuineCheck,
  getAddress,
  getBatteryStatus,
  getDeviceRunningMode,
  getTransactionStatus,
  i18n,
  liveData,
  managerListApps,
  portfolio,
  proxy,
  receive,
  repl,
  satstack,
  satstackStatus,
  scanDescriptors,
  send,
  signMessage,
  speculosList,
  staxFetchAndRestoreDemo,
  staxFetchImage,
  staxFetchImageHash,
  staxLoadImage,
  swap,
  sync,
  synchronousOnboarding,
  testDetectOpCollision,
  testGetTrustedInputFromTxHash,
  user,
  version,
  walletconnect
};
