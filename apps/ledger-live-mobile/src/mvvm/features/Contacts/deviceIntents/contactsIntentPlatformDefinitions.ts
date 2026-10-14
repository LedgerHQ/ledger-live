import type { ContactsIntentPlatformDefinitions } from "@features/platform-contacts/device";
import { editExternalAddressIntentPlatformDefinition } from "./editExternalAddressIntent/intentPlatformDefinition";
import { registerExternalAddressIntentPlatformDefinition } from "./registerExternalAddressIntent/intentPlatformDefinition";
import { registerLedgerAccountIntentPlatformDefinition } from "./registerLedgerAccountIntent/intentPlatformDefinition";
import { renameContactIntentPlatformDefinition } from "./renameContactIntent/intentPlatformDefinition";
import { renameLedgerAccountIntentPlatformDefinition } from "./renameLedgerAccountIntent/intentPlatformDefinition";

/** The Contacts intent renderers this app injects into the shared orchestrator. */
export const contactsIntentPlatformDefinitions: ContactsIntentPlatformDefinitions = {
  registerExternalAddress: registerExternalAddressIntentPlatformDefinition,
  renameExternalContact: renameContactIntentPlatformDefinition,
  editExternalAddress: editExternalAddressIntentPlatformDefinition,
  registerLedgerAccount: registerLedgerAccountIntentPlatformDefinition,
  renameLedgerAccount: renameLedgerAccountIntentPlatformDefinition,
};
