import type { DemoIntentDefinitions } from "./orchestrationTypes";
import { getAddressLegacyTransportCompatDemoIntentPlatformDefinition } from "./getAddressLegacyTransportCompatDemoIntent/intentPlatformDefinition";
import { getEthAddressDMKSignerDemoIntentPlatformDefinition } from "./getEthAddressDMKSignerDemoIntent/intentPlatformDefinition";
import { timerDemoIntentPlatformDefinition } from "./timerDemoIntent/intentPlatformDefinition";
import { uninstallAppDemoIntentPlatformDefinition } from "./uninstallAppDemoIntent/intentPlatformDefinition";

export const DEMO_INTENT_DEFS: DemoIntentDefinitions = {
  timer: timerDemoIntentPlatformDefinition,
  getAddressLegacyTransportCompat: getAddressLegacyTransportCompatDemoIntentPlatformDefinition,
  getEthAddressDMKSigner: getEthAddressDMKSignerDemoIntentPlatformDefinition,
  uninstallApp: uninstallAppDemoIntentPlatformDefinition,
};
