import type { ContactsIntentPlatformDefinitions } from "@features/platform-contacts/device";
import { editExternalAddressIntentLWMDefinition } from "./editExternalAddressIntent/intentLWMDefinition";
import { registerExternalAddressIntentLWMDefinition } from "./registerExternalAddressIntent/intentLWMDefinition";
import { registerLedgerAccountIntentLWMDefinition } from "./registerLedgerAccountIntent/intentLWMDefinition";
import { renameContactIntentLWMDefinition } from "./renameContactIntent/intentLWMDefinition";
import { renameLedgerAccountIntentLWMDefinition } from "./renameLedgerAccountIntent/intentLWMDefinition";

/** The Contacts intent renderers this app injects into the shared orchestrator. */
export const contactsIntentLWMDefinitions: ContactsIntentPlatformDefinitions = {
  registerExternalAddress: registerExternalAddressIntentLWMDefinition,
  renameExternalContact: renameContactIntentLWMDefinition,
  editExternalAddress: editExternalAddressIntentLWMDefinition,
  registerLedgerAccount: registerLedgerAccountIntentLWMDefinition,
  renameLedgerAccount: renameLedgerAccountIntentLWMDefinition,
};
