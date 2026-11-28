import { signTransactionIntentWithResultDefinition } from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { SignTransactionIntentWithResultPlatformDefinition } from "@ledgerhq/live-common/intents/signTransactionIntent";
import { SignTransactionIntentComponentLWD } from "./componentLWD";
import type { SignatureExtraProps } from "./types";

export const signTransactionIntentLWDDefinition: SignTransactionIntentWithResultPlatformDefinition<SignatureExtraProps> =
  {
    ...signTransactionIntentWithResultDefinition,
    component: SignTransactionIntentComponentLWD,
  };
