import { signPermit2EvmIntentDefinition } from "@ledgerhq/live-common/wallet-api/Exchange/intents/signPermit2Evm/index";
import { SignPermit2EvmIntentComponentLWM } from "./componentLWM";
import type { SignPermit2EvmIntentPlatformDefinition } from "./types";

export const signPermit2EvmIntentLWMDefinition: SignPermit2EvmIntentPlatformDefinition = {
  ...signPermit2EvmIntentDefinition,
  component: SignPermit2EvmIntentComponentLWM,
};
