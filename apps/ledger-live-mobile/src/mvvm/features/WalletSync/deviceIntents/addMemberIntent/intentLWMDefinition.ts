import {
  addMemberIntentDefinition,
  type AddMemberIntentPlatformDefinition,
} from "@features/platform-intent-wallet-sync";
import { AddMemberComponentLWM } from "./componentLWM";

export const addMemberIntentLWMDefinition: AddMemberIntentPlatformDefinition = {
  ...addMemberIntentDefinition,
  component: AddMemberComponentLWM,
};
