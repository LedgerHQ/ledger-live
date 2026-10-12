import { GetAddressLegacyWithDeviceDemoIntentComponent } from "./component";
import { getAddressLegacyWithDeviceDemoIntentDefinition } from "./intentDefinition";
import { type GetAddressLegacyWithDeviceDemoIntentPlatformDefinition } from "./types";

export const getAddressLegacyWithDeviceDemoIntentPlatformDefinition: GetAddressLegacyWithDeviceDemoIntentPlatformDefinition =
  {
    ...getAddressLegacyWithDeviceDemoIntentDefinition,
    component: GetAddressLegacyWithDeviceDemoIntentComponent,
  };
