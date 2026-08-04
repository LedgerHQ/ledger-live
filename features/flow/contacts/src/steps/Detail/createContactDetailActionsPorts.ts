import {
  ContactError,
  deleteContact as deleteContactAction,
  parseContactName,
  renameContact as renameContactAction,
  selectContactById,
} from "@domain/entity-contact";
import type { ContactDetailActionsPorts } from "./model/ports";

type ContactDetailActionsPortsDeps = Readonly<{
  dispatch: (action: { type: string }) => void;
  getState: () => Parameters<typeof selectContactById>[0];
}>;

export function createContactDetailActionsPorts({
  dispatch,
  getState,
}: ContactDetailActionsPortsDeps): ContactDetailActionsPorts {
  return {
    edit: {
      renameContact: async ({ contactId, name }) => {
        dispatch(renameContactAction({ contactId, name: parseContactName(name) }));
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
