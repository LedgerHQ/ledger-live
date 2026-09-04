import {
  renameLedgerAccountIntentDefinition,
  type RenameLedgerAccountIntentPlatformDefinition,
} from "@features/platform-contacts/device/intents";
import { RenameLedgerAccountComponentLWM } from "./componentLWM";

export const renameLedgerAccountIntentLWMDefinition: RenameLedgerAccountIntentPlatformDefinition = {
  ...renameLedgerAccountIntentDefinition,
  component: RenameLedgerAccountComponentLWM,
};
