import type { DemoIntentDefinitions } from "./orchestrationTypes";
import { getAddressLegacyWithDeviceDemoIntentLWDDefinition } from "./getAddressLegacyWithDeviceDemoIntent/intentLWDDefinition";
import { getEthAddressDMKSignerDemoIntentLWDDefinition } from "./getEthAddressDMKSignerDemoIntent/intentLWDDefinition";
import { timerDemoIntentLWDDefinition } from "./timerDemoIntent/intentLWDDefinition";
import { uninstallAppDemoIntentLWDDefinition } from "./uninstallAppDemoIntent/intentLWDDefinition";

export const DEMO_INTENT_DEFS: DemoIntentDefinitions = {
  timer: timerDemoIntentLWDDefinition,
  getAddressLegacyWithDevice: getAddressLegacyWithDeviceDemoIntentLWDDefinition,
  getEthAddressDMKSigner: getEthAddressDMKSignerDemoIntentLWDDefinition,
  uninstallApp: uninstallAppDemoIntentLWDDefinition,
};
