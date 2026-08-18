import { SignMessageIntentComponent } from "./component";
import { signMessageIntentDefinition } from "@ledgerhq/live-common/intents/signMessageIntent";
import type { SignMessageIntentPlatformDefinition } from "@ledgerhq/live-common/intents/signMessageIntent";

export const signMessageIntentPlatformDefinition: SignMessageIntentPlatformDefinition = {
  ...signMessageIntentDefinition,
  component: SignMessageIntentComponent,
};
