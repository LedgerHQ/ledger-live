import { GetEthAddressDMKSignerDemoIntentComponentLWM } from "./componentLWM";
import { getEthAddressDMKSignerDemoIntentDefinition } from "./intentDefinition";
import { type GetEthAddressDMKSignerDemoIntentPlatformDefinition } from "./types";

export const getEthAddressDMKSignerDemoIntentLWMDefinition: GetEthAddressDMKSignerDemoIntentPlatformDefinition =
  {
    ...getEthAddressDMKSignerDemoIntentDefinition,
    component: GetEthAddressDMKSignerDemoIntentComponentLWM,
  };
