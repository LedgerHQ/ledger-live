import { signRawTransactionIntentDefinition } from "@ledgerhq/live-common/intents/signRawTransactionIntent";
import type { SignRawTransactionIntentPlatformDefinition } from "@ledgerhq/live-common/intents/signRawTransactionIntent";
import { SignRawTransactionIntentComponentLWM, type RentSignatureExtraProps } from "./componentLWM";

export const signRawTransactionIntentLWMDefinition: SignRawTransactionIntentPlatformDefinition<RentSignatureExtraProps> =
  {
    ...signRawTransactionIntentDefinition,
    component: SignRawTransactionIntentComponentLWM,
  };
