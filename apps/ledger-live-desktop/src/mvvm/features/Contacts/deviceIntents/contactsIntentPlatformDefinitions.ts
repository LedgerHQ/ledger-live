import type { ContactsIntentPlatformDefinitions } from "@features/platform-contacts/device";
import { editExternalAddressIntentLWDDefinition } from "./editExternalAddressIntent/intentLWDDefinition";
import { registerExternalAddressIntentLWDDefinition } from "./registerExternalAddressIntent/intentLWDDefinition";
import { renameContactIntentLWDDefinition } from "./renameContactIntent/intentLWDDefinition";

/**
 * The Contacts intent renderers this app injects into the shared orchestrator.
 * Intents without a production caller are not listed here; the DIE devtool
 * drives those directly from their own platform definitions.
 */
export const contactsIntentLWDDefinitions: ContactsIntentPlatformDefinitions = {
  registerExternalAddress: registerExternalAddressIntentLWDDefinition,
  renameExternalContact: renameContactIntentLWDDefinition,
  editExternalAddress: editExternalAddressIntentLWDDefinition,
};
