import { GetEthAddressDMKSignerDemoIntentComponentLWD } from "./componentLWD";
import { getEthAddressDMKSignerDemoIntentDefinition } from "./intentDefinition";
import { type GetEthAddressDMKSignerDemoIntentPlatformDefinition } from "./types";

export const getEthAddressDMKSignerDemoIntentLWDDefinition: GetEthAddressDMKSignerDemoIntentPlatformDefinition =
  {
    ...getEthAddressDMKSignerDemoIntentDefinition,
    component: GetEthAddressDMKSignerDemoIntentComponentLWD,
  };
