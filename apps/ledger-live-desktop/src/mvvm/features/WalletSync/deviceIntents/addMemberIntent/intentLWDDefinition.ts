import {
  addMemberIntentDefinition,
  type AddMemberIntentPlatformDefinition,
} from "@features/platform-key-ring";
import { AddMemberComponentLWD } from "./componentLWD";

export const addMemberIntentLWDDefinition: AddMemberIntentPlatformDefinition = {
  ...addMemberIntentDefinition,
  component: AddMemberComponentLWD,
};
