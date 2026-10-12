import type { DemoIntentDefinitions } from "./orchestrationTypes";
import { getAddressLegacyWithDeviceDemoIntentPlatformDefinition } from "./getAddressLegacyWithDeviceDemoIntent/intentPlatformDefinition";
import { getEthAddressDMKSignerDemoIntentPlatformDefinition } from "./getEthAddressDMKSignerDemoIntent/intentPlatformDefinition";
import { timerDemoIntentPlatformDefinition } from "./timerDemoIntent/intentPlatformDefinition";
import { uninstallAppDemoIntentPlatformDefinition } from "./uninstallAppDemoIntent/intentPlatformDefinition";

export const DEMO_INTENT_DEFS: DemoIntentDefinitions = {
  timer: timerDemoIntentPlatformDefinition,
  getAddressLegacyWithDevice: getAddressLegacyWithDeviceDemoIntentPlatformDefinition,
  getEthAddressDMKSigner: getEthAddressDMKSignerDemoIntentPlatformDefinition,
  uninstallApp: uninstallAppDemoIntentPlatformDefinition,
};
