import { signTransactionIntentDefinition } from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { SignTransactionIntentPlatformDefinition } from "@ledgerhq/live-common/intents/signTransactionIntent";
import { SignTransactionIntentComponentLWM } from "./componentLWM";
import type { SignatureExtraProps } from "./types";

export const signTransactionIntentLWMDefinition: SignTransactionIntentPlatformDefinition<SignatureExtraProps> =
  {
    ...signTransactionIntentDefinition,
    component: SignTransactionIntentComponentLWM,
  };
