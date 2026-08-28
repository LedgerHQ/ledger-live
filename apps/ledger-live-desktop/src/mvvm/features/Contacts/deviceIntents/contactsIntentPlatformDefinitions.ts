import type { ContactsIntentPlatformDefinitions } from "@features/platform-contacts/device";
import { editExternalAddressIntentLWDDefinition } from "./editExternalAddressIntent/intentLWDDefinition";
import { registerExternalAddressIntentLWDDefinition } from "./registerExternalAddressIntent/intentLWDDefinition";
import { registerLedgerAccountIntentLWDDefinition } from "./registerLedgerAccountIntent/intentLWDDefinition";
import { renameContactIntentLWDDefinition } from "./renameContactIntent/intentLWDDefinition";
import { renameLedgerAccountIntentLWDDefinition } from "./renameLedgerAccountIntent/intentLWDDefinition";

/** The Contacts intent renderers this app injects into the shared orchestrator. */
export const contactsIntentLWDDefinitions: ContactsIntentPlatformDefinitions = {
  registerExternalAddress: registerExternalAddressIntentLWDDefinition,
  renameExternalContact: renameContactIntentLWDDefinition,
  editExternalAddress: editExternalAddressIntentLWDDefinition,
  registerLedgerAccount: registerLedgerAccountIntentLWDDefinition,
  renameLedgerAccount: renameLedgerAccountIntentLWDDefinition,
};
