import {
  removeMemberIntentDefinition,
  type RemoveMemberIntentPlatformDefinition,
} from "@features/platform-key-ring";
import { RemoveMemberComponentLWD } from "./componentLWD";

export const removeMemberIntentLWDDefinition: RemoveMemberIntentPlatformDefinition = {
  ...removeMemberIntentDefinition,
  component: RemoveMemberComponentLWD,
};
