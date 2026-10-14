import {
  renameContactIntentDefinition,
  type RenameContactIntentPlatformDefinition,
} from "@features/platform-contacts/device/intents";
import { RenameContactComponent } from "./component";

export const renameContactIntentPlatformDefinition: RenameContactIntentPlatformDefinition = {
  ...renameContactIntentDefinition,
  component: RenameContactComponent,
};
