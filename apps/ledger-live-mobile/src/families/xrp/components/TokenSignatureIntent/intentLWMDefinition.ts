import {
  signTransactionIntentWithResultDefinition,
  type SignTransactionIntentWithResultPlatformDefinition,
} from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { SignatureExtraProps } from "LLM/features/Send/screens/Signature/intents/signTransactionIntent/types";
import { TokenSignatureIntentComponentLWM } from "./componentLWM";

export const tokenSignatureIntentLWMDefinition: SignTransactionIntentWithResultPlatformDefinition<SignatureExtraProps> =
  {
    ...signTransactionIntentWithResultDefinition,
    component: TokenSignatureIntentComponentLWM,
  };
