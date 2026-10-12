import {
  renameLedgerAccountIntentDefinition,
  type RenameLedgerAccountIntentPlatformDefinition,
} from "@features/platform-contacts/device/intents";
import { RenameLedgerAccountComponent } from "./component";

export const renameLedgerAccountIntentPlatformDefinition: RenameLedgerAccountIntentPlatformDefinition =
  {
    ...renameLedgerAccountIntentDefinition,
    component: RenameLedgerAccountComponent,
  };
