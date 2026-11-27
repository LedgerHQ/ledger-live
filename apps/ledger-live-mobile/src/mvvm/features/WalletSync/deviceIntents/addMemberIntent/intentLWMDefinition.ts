import {
  addMemberIntentDefinition,
  type AddMemberIntentPlatformDefinition,
} from "@features/platform-key-ring";
import { AddMemberComponentLWM } from "./componentLWM";

export const addMemberIntentLWMDefinition: AddMemberIntentPlatformDefinition = {
  ...addMemberIntentDefinition,
  component: AddMemberComponentLWM,
};
