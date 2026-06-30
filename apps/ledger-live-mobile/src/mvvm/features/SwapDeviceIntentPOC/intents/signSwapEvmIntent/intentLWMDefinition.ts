import { signSwapEvmIntentDefinition } from "@ledgerhq/live-common/wallet-api/Exchange/intents/signSwapEvm/index";
import { SignSwapEvmIntentComponentLWM } from "./componentLWM";
import type { SignSwapEvmIntentPlatformDefinition } from "./types";

export const signSwapEvmIntentLWMDefinition: SignSwapEvmIntentPlatformDefinition = {
  ...signSwapEvmIntentDefinition,
  component: SignSwapEvmIntentComponentLWM,
};
