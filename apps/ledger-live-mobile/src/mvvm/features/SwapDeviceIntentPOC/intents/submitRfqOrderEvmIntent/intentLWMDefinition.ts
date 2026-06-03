import { submitRfqOrderEvmIntentDefinition } from "@ledgerhq/live-common/wallet-api/Exchange/intents/submitRfqOrderEvm/index";
import { SubmitRfqOrderEvmIntentComponentLWM } from "./componentLWM";
import type { SubmitRfqOrderEvmIntentPlatformDefinition } from "./types";

export const submitRfqOrderEvmIntentLWMDefinition: SubmitRfqOrderEvmIntentPlatformDefinition =
  {
    ...submitRfqOrderEvmIntentDefinition,
    component: SubmitRfqOrderEvmIntentComponentLWM,
  };
