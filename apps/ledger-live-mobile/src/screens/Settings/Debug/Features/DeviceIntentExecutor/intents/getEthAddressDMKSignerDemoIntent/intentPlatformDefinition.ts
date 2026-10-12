import { GetEthAddressDMKSignerDemoIntentComponent } from "./component";
import { getEthAddressDMKSignerDemoIntentDefinition } from "./intentDefinition";
import { type GetEthAddressDMKSignerDemoIntentPlatformDefinition } from "./types";

export const getEthAddressDMKSignerDemoIntentPlatformDefinition: GetEthAddressDMKSignerDemoIntentPlatformDefinition =
  {
    ...getEthAddressDMKSignerDemoIntentDefinition,
    component: GetEthAddressDMKSignerDemoIntentComponent,
  };
