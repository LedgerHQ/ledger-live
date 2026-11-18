import {
  removeMemberIntentDefinition,
  type RemoveMemberIntentPlatformDefinition,
} from "@features/platform-intent-wallet-sync";
import { RemoveMemberComponentLWD } from "./componentLWD";

export const removeMemberIntentLWDDefinition: RemoveMemberIntentPlatformDefinition = {
  ...removeMemberIntentDefinition,
  component: RemoveMemberComponentLWD,
};
