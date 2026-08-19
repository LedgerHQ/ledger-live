import type { DemoIntentDefinitions } from "./orchestrationTypes";
import { getAddressLegacyTransportCompatDemoIntentLWDDefinition } from "./getAddressLegacyTransportCompatDemoIntent/intentLWDDefinition";
import { getEthAddressDMKSignerDemoIntentLWDDefinition } from "./getEthAddressDMKSignerDemoIntent/intentLWDDefinition";
import { timerDemoIntentLWDDefinition } from "./timerDemoIntent/intentLWDDefinition";
import { uninstallAppDemoIntentLWDDefinition } from "./uninstallAppDemoIntent/intentLWDDefinition";

export const DEMO_INTENT_DEFS: DemoIntentDefinitions = {
  timer: timerDemoIntentLWDDefinition,
  getAddressLegacyTransportCompat: getAddressLegacyTransportCompatDemoIntentLWDDefinition,
  getEthAddressDMKSigner: getEthAddressDMKSignerDemoIntentLWDDefinition,
  uninstallApp: uninstallAppDemoIntentLWDDefinition,
};
