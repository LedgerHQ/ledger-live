import {
  signTransactionIntentDefinition,
  type SignTransactionIntentPlatformDefinition,
} from "@ledgerhq/live-common/intents/signTransactionIntent";
import { SignTransactionIntentComponentLWD } from "./componentLWD";
import type { SignTransactionIntentComponentExtraProps } from "./types";

export const signTransactionIntentLWDDefinition: SignTransactionIntentPlatformDefinition<SignTransactionIntentComponentExtraProps> =
  {
    ...signTransactionIntentDefinition,
    component: SignTransactionIntentComponentLWD,
  };
