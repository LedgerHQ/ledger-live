import {
  renameContactIntentDefinition,
  type RenameContactIntentPlatformDefinition,
} from "@features/platform-contacts/device/intents";
import { RenameContactComponentLWD } from "./componentLWD";

export const renameContactIntentLWDDefinition: RenameContactIntentPlatformDefinition = {
  ...renameContactIntentDefinition,
  component: RenameContactComponentLWD,
};
