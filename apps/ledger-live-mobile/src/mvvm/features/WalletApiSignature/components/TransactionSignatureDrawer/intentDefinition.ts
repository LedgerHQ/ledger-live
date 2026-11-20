import { SignTransactionIntentComponent } from "./component";
import { signTransactionIntentDefinition } from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { SignTransactionIntentPlatformDefinition } from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { SignTransactionIntentComponentExtraProps } from "./types";

export const signTransactionIntentPlatformDefinition: SignTransactionIntentPlatformDefinition<SignTransactionIntentComponentExtraProps> =
  {
    ...signTransactionIntentDefinition,
    component: SignTransactionIntentComponent,
  };
