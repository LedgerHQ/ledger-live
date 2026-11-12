import {
  removeMemberIntentDefinition,
  type RemoveMemberIntentPlatformDefinition,
} from "@features/platform-intent-wallet-sync";
import { RemoveMemberComponentLWM } from "./componentLWM";

export const removeMemberIntentLWMDefinition: RemoveMemberIntentPlatformDefinition = {
  ...removeMemberIntentDefinition,
  component: RemoveMemberComponentLWM,
};
