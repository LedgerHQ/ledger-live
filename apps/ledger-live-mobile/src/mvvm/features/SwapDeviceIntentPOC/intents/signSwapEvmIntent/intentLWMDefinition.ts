import { SignSwapEvmIntentComponentLWM } from "./componentLWM";
import { signSwapEvmIntentDefinition } from "./intentDefinition";
import type { SignSwapEvmIntentPlatformDefinition } from "./types";

export const signSwapEvmIntentLWMDefinition: SignSwapEvmIntentPlatformDefinition = {
  ...signSwapEvmIntentDefinition,
  component: SignSwapEvmIntentComponentLWM,
};
