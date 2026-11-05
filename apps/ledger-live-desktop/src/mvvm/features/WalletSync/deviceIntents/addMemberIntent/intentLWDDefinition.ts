import {
  addMemberIntentDefinition,
  type AddMemberIntentPlatformDefinition,
} from "@features/platform-intent-wallet-sync";
import { AddMemberComponentLWD } from "./componentLWD";

export const addMemberIntentLWDDefinition: AddMemberIntentPlatformDefinition = {
  ...addMemberIntentDefinition,
  component: AddMemberComponentLWD,
};
