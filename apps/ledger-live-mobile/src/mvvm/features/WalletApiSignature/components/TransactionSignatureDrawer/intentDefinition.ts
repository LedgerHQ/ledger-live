import { SignTransactionIntentComponent } from "./component";
import { signTransactionIntentDefinition } from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { SignTransactionIntentPlatformDefinition } from "@ledgerhq/live-common/intents/signTransactionIntent";

export const signTransactionIntentPlatformDefinition: SignTransactionIntentPlatformDefinition = {
  ...signTransactionIntentDefinition,
  component: SignTransactionIntentComponent,
};
