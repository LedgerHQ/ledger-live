import type { DemoIntentDefinitions } from "./orchestrationTypes";
import { getAddressLegacyWithDeviceDemoIntentLWMDefinition } from "./getAddressLegacyWithDeviceDemoIntent/intentLWMDefinition";
import { getEthAddressDMKSignerDemoIntentLWMDefinition } from "./getEthAddressDMKSignerDemoIntent/intentLWMDefinition";
import { timerDemoIntentLWMDefinition } from "./timerDemoIntent/intentLWMDefinition";
import { uninstallAppDemoIntentLWMDefinition } from "./uninstallAppDemoIntent/intentLWMDefinition";

export const DEMO_INTENT_DEFS: DemoIntentDefinitions = {
  timer: timerDemoIntentLWMDefinition,
  getAddressLegacyWithDevice: getAddressLegacyWithDeviceDemoIntentLWMDefinition,
  getEthAddressDMKSigner: getEthAddressDMKSignerDemoIntentLWMDefinition,
  uninstallApp: uninstallAppDemoIntentLWMDefinition,
};
