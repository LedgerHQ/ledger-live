import {
  ContactError,
  parseContactName,
  renameContact as renameContactAction,
  selectContactById,
} from "@domain/entity-contact";
import type { ContactDeviceIntentsPort } from "../contactDeviceIntentsPort";
import type { ContactEditPort } from "./ports";

type CreateContactEditPortDependencies = Readonly<{
  dispatch: (action: { type: string }) => void;
  getState: () => Parameters<typeof selectContactById>[0];
  deviceIntents: ContactDeviceIntentsPort;
}>;

export function createContactEditPort({
  dispatch,
  getState,
  deviceIntents,
}: CreateContactEditPortDependencies): ContactEditPort {
  return {
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
  };
}
