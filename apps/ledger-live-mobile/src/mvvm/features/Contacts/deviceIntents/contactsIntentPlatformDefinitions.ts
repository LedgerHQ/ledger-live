import type { ContactsIntentPlatformDefinitions } from "@features/platform-contacts/device";
import { editExternalAddressIntentLWMDefinition } from "./editExternalAddressIntent/intentLWMDefinition";
import { registerExternalAddressIntentLWMDefinition } from "./registerExternalAddressIntent/intentLWMDefinition";
import { renameContactIntentLWMDefinition } from "./renameContactIntent/intentLWMDefinition";

/**
 * The Contacts intent renderers this app injects into the shared orchestrator.
 * Intents without a production caller are not listed here; the DIE devtool
 * drives those directly from their own platform definitions.
 */
export const contactsIntentLWMDefinitions: ContactsIntentPlatformDefinitions = {
  registerExternalAddress: registerExternalAddressIntentLWMDefinition,
  renameExternalContact: renameContactIntentLWMDefinition,
  editExternalAddress: editExternalAddressIntentLWMDefinition,
};
