import {
  ContactError,
  deleteContact as deleteContactAction,
  parseContactName,
  renameContact as renameContactAction,
  selectContactById,
} from "@domain/entity-contact";
import {
  createMockContactDeviceIntentsPort,
  type ContactDeviceIntentsPort,
} from "@features/platform-contacts";
import type { ContactDetailActionsPorts } from "./model/ports";

type ContactDetailActionsPortsDeps = Readonly<{
  dispatch: (action: { type: string }) => void;
  getState: () => Parameters<typeof selectContactById>[0];
  deviceIntents?: ContactDeviceIntentsPort;
}>;

export function createContactDetailActionsPorts({
  dispatch,
  getState,
  deviceIntents = createMockContactDeviceIntentsPort(),
}: ContactDetailActionsPortsDeps): ContactDetailActionsPorts {
  return {
    edit: {
      renameContact: async ({ contactId, name }) => {
        const currentContact = selectContactById(getState(), contactId);
        if (currentContact === undefined) {
          throw new ContactError(`Contact not found: ${contactId}`);
        }

        const parsedName = parseContactName(name);
        const deviceCredentials =
          currentContact.addresses.length === 0
            ? undefined
            : await deviceIntents.renameExternalContact({
                contact: currentContact,
                name: parsedName,
              });

        dispatch(renameContactAction({ contactId, name: parsedName, deviceCredentials }));
        const updatedContact = selectContactById(getState(), contactId);

        if (updatedContact === undefined) {
          throw new ContactError(`Contact not found: ${contactId}`);
        }

        return updatedContact;
      },
    },
    deletion: {
      deleteContact: async contactIdToDelete => {
        dispatch(deleteContactAction(contactIdToDelete));
      },
    },
  };
}
