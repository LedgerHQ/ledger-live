import {
  renameContactIntentDefinition,
  type RenameContactIntentPlatformDefinition,
} from "@features/platform-contacts/device/intents";
import { RenameContactComponentLWM } from "./componentLWM";

export const renameContactIntentLWMDefinition: RenameContactIntentPlatformDefinition = {
  ...renameContactIntentDefinition,
  component: RenameContactComponentLWM,
};
