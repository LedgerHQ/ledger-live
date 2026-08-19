import { GetAddressLegacyWithDeviceDemoIntentComponentLWD } from "./componentLWD";
import { getAddressLegacyWithDeviceDemoIntentDefinition } from "./intentDefinition";
import { type GetAddressLegacyWithDeviceDemoIntentPlatformDefinition } from "./types";

export const getAddressLegacyWithDeviceDemoIntentLWDDefinition: GetAddressLegacyWithDeviceDemoIntentPlatformDefinition =
  {
    ...getAddressLegacyWithDeviceDemoIntentDefinition,
    component: GetAddressLegacyWithDeviceDemoIntentComponentLWD,
  };
