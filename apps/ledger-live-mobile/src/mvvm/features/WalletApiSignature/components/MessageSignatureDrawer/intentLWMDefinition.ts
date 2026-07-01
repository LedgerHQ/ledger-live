import { SignMessageIntentComponentLWM } from "./componentLWM";
import { signMessageIntentDefinition } from "@ledgerhq/live-common/intents/signMessageIntent";
import type { SignMessageIntentPlatformDefinition } from "@ledgerhq/live-common/intents/signMessageIntent";

export const signMessageIntentLWMDefinition: SignMessageIntentPlatformDefinition = {
  ...signMessageIntentDefinition,
  component: SignMessageIntentComponentLWM,
};
