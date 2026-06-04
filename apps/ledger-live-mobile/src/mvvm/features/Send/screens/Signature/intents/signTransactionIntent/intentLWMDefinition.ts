import { SignTransactionIntentComponentLWM } from "./componentLWM";
import { signTransactionIntentDefinition } from "@ledgerhq/live-common/intents/signTransactionIntent";
import type { SignTransactionIntentPlatformDefinition } from "@ledgerhq/live-common/intents/signTransactionIntent";

export const signTransactionIntentLWMDefinition: SignTransactionIntentPlatformDefinition = {
  ...signTransactionIntentDefinition,
  component: SignTransactionIntentComponentLWM,
};
