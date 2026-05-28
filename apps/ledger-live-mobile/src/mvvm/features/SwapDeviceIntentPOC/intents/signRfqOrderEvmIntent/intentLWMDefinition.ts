import { signRfqOrderEvmIntentDefinition } from "@ledgerhq/live-common/wallet-api/Exchange/intents/signRfqOrderEvm/index";
import { SignRfqOrderEvmIntentComponentLWM } from "./componentLWM";
import type { SignRfqOrderEvmIntentPlatformDefinition } from "./types";

export const signRfqOrderEvmIntentLWMDefinition: SignRfqOrderEvmIntentPlatformDefinition =
  {
    ...signRfqOrderEvmIntentDefinition,
    component: SignRfqOrderEvmIntentComponentLWM,
  };
