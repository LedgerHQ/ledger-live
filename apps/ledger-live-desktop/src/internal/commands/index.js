// @flow
import checkRPCNodeConfig from "./checkRPCNodeConfig";
import firmwarePrepare from "./firmwarePrepare";
import firmwareMain from "./firmwareMain";
import firmwareRepair from "./firmwareRepair";
import flushDevice from "./flushDevice";
import waitForDeviceInfo from "./waitForDeviceInfo";
import getLatestFirmwareForDevice from "./getLatestFirmwareForDevice";
import getSatStackStatus from "./getSatStackStatus";
import listenToHidDevices from "./listenToHidDevices";
import listApps from "./listApps";
import signMessage from "./signMessage";
import ping from "./ping";
import connectApp from "./connectApp";
import connectManager from "./connectManager";
import networkTroubleshoot from "./networkTroubleshoot";
import testApdu from "./testApdu";
import testCrash from "./testCrash";
import testInterval from "./testInterval";
import appOpExec from "./appOpExec";
import initSwap from "./initSwap";
import startExchange from "./startExchange";
import completeExchange from "./completeExchange";
import websocketBridge from "./websocketBridge";
import checkSignatureAndPrepare from "./checkSignatureAndPrepare";
import getTransactionId from "./getTransactionId";
import scanDescriptors from "./scanDescriptors";
import installLanguage from "./installLanguage";
import getAppAndVersion from "./getAppAndVersion";
import getDeviceInfo from "./getDeviceInfo";
import staxLoadImage from "./staxLoadImage";
import getOnboardingStatePolling from "./getOnboardingStatePolling";
import getGenuineCheckFromDeviceId from "./getGenuineCheckFromDeviceId";
import getLatestAvailableFirmwareFromDeviceId from "./getLatestAvailableFirmwareFromDeviceId";
import { commands as bridgeProxyCommands } from "~/renderer/bridge/proxy-commands";

export const commandsById = {
  appOpExec,
  ...bridgeProxyCommands,
  checkRPCNodeConfig,
  firmwarePrepare,
  firmwareMain,
  firmwareRepair,
  flushDevice,
  waitForDeviceInfo,
  getLatestFirmwareForDevice,
  getSatStackStatus,
  listenToHidDevices,
  connectApp,
  connectManager,
  listApps,
  ping,
  networkTroubleshoot,
  testApdu,
  initSwap,
  startExchange,
  completeExchange,
  checkSignatureAndPrepare,
  getTransactionId,
  testCrash,
  testInterval,
  websocketBridge,
  scanDescriptors,
  installLanguage,
  signMessage,
  getAppAndVersion,
  getDeviceInfo,
  staxLoadImage,
  getOnboardingStatePolling,
  getGenuineCheckFromDeviceId,
  getLatestAvailableFirmwareFromDeviceId,
};

export type Commands = typeof commandsById;
export type CommandFn<Id: $Keys<Commands>> = $ElementType<Commands, Id>;
