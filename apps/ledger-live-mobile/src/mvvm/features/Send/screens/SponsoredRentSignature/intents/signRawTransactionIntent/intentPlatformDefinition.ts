import { signRawTransactionIntentDefinition } from "@ledgerhq/live-common/intents/signRawTransactionIntent";
import type { SignRawTransactionIntentPlatformDefinition } from "@ledgerhq/live-common/intents/signRawTransactionIntent";
import { SignRawTransactionIntentComponent, type RentSignatureExtraProps } from "./component";

export const signRawTransactionIntentPlatformDefinition: SignRawTransactionIntentPlatformDefinition<RentSignatureExtraProps> =
  {
    ...signRawTransactionIntentDefinition,
    component: SignRawTransactionIntentComponent,
  };
