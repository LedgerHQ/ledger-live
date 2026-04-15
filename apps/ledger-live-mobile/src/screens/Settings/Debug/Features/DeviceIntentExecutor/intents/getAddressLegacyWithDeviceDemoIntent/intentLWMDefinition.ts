import { GetAddressLegacyWithDeviceDemoIntentComponentLWM } from "./componentLWM";
import { getAddressLegacyWithDeviceDemoIntentDefinition } from "./intentDefinition";
import { type GetAddressLegacyWithDeviceDemoIntentPlatformDefinition } from "./types";

export const getAddressLegacyWithDeviceDemoIntentLWMDefinition: GetAddressLegacyWithDeviceDemoIntentPlatformDefinition =
  {
    ...getAddressLegacyWithDeviceDemoIntentDefinition,
    component: GetAddressLegacyWithDeviceDemoIntentComponentLWM,
  };
