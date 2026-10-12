import { GetAddressLegacyTransportCompatDemoIntentComponent } from "./component";
import { getAddressLegacyTransportCompatDemoIntentDefinition } from "./intentDefinition";
import { type GetAddressLegacyTransportCompatDemoIntentPlatformDefinition } from "./types";

export const getAddressLegacyTransportCompatDemoIntentPlatformDefinition: GetAddressLegacyTransportCompatDemoIntentPlatformDefinition =
  {
    ...getAddressLegacyTransportCompatDemoIntentDefinition,
    component: GetAddressLegacyTransportCompatDemoIntentComponent,
  };
