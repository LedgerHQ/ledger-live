import {
  removeMemberIntentDefinition,
  type RemoveMemberIntentPlatformDefinition,
} from "@features/platform-key-ring";
import { RemoveMemberComponentLWM } from "./componentLWM";

export const removeMemberIntentLWMDefinition: RemoveMemberIntentPlatformDefinition = {
  ...removeMemberIntentDefinition,
  component: RemoveMemberComponentLWM,
};
