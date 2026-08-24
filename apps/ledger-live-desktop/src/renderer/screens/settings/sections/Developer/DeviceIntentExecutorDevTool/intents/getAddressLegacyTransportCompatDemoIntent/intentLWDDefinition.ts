import { GetAddressLegacyTransportCompatDemoIntentComponentLWD } from "./componentLWD";
import { getAddressLegacyTransportCompatDemoIntentDefinition } from "./intentDefinition";
import { type GetAddressLegacyTransportCompatDemoIntentPlatformDefinition } from "./types";

export const getAddressLegacyTransportCompatDemoIntentLWDDefinition: GetAddressLegacyTransportCompatDemoIntentPlatformDefinition =
  {
    ...getAddressLegacyTransportCompatDemoIntentDefinition,
    component: GetAddressLegacyTransportCompatDemoIntentComponentLWD,
  };
