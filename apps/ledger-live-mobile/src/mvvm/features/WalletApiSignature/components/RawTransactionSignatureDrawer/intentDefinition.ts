import { signRawTransactionIntentDefinition } from "@ledgerhq/live-common/intents/signRawTransactionIntent";
import type { SignRawTransactionIntentPlatformDefinition } from "@ledgerhq/live-common/intents/signRawTransactionIntent";
import {
  SignTransactionIntentComponent,
  type SignTransactionIntentComponentExtraProps,
} from "../TransactionSignatureDrawer/component";

// Raw signing emits the same job states as transaction signing, so it reuses its screens.
export const signRawTransactionIntentPlatformDefinition: SignRawTransactionIntentPlatformDefinition<SignTransactionIntentComponentExtraProps> =
  {
    ...signRawTransactionIntentDefinition,
    component: SignTransactionIntentComponent,
  };
