import {
  signMessageIntentDefinition,
  type SignMessageIntentPlatformDefinition,
} from "@ledgerhq/live-common/intents/signMessageIntent";
import { SignMessageIntentComponentLWD } from "./componentLWD";

export const signMessageIntentLWDDefinition: SignMessageIntentPlatformDefinition = {
  ...signMessageIntentDefinition,
  component: SignMessageIntentComponentLWD,
};
