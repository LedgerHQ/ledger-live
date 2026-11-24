import {
  signTransactionIntentWithResultDefinition,
  type SignTransactionIntentWithResultPlatformDefinition,
} from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { SignatureExtraProps } from "LLM/features/Send/screens/Signature/intents/signTransactionIntent/types";
import { DeleteTokenIntentComponentLWM } from "./componentLWM";

export const deleteTokenIntentLWMDefinition: SignTransactionIntentWithResultPlatformDefinition<SignatureExtraProps> =
  {
    ...signTransactionIntentWithResultDefinition,
    component: DeleteTokenIntentComponentLWM,
  };
