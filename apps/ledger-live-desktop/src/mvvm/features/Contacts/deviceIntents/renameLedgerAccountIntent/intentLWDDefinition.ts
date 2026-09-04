import {
  renameLedgerAccountIntentDefinition,
  type RenameLedgerAccountIntentPlatformDefinition,
} from "@features/platform-contacts/device/intents";
import { RenameLedgerAccountComponentLWD } from "./componentLWD";

export const renameLedgerAccountIntentLWDDefinition: RenameLedgerAccountIntentPlatformDefinition = {
  ...renameLedgerAccountIntentDefinition,
  component: RenameLedgerAccountComponentLWD,
};
