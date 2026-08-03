import {
  deleteContact as deleteContactAction,
  parseContactName,
  renameContact as renameContactAction,
  selectContactById,
} from "@domain/entity-contact";
import { useMemo } from "react";
import type { ContactDetailActionsPorts } from "@features/flow-contacts";
import { useDispatch, useStore } from "LLD/hooks/redux";

export function useContactsEditDeletePorts(): ContactDetailActionsPorts {
  const dispatch = useDispatch();
  const store = useStore();

  return useMemo<ContactDetailActionsPorts>(
    () => ({
      edit: {
        renameContact: async ({ contactId, name }) => {
          dispatch(renameContactAction({ contactId, name: parseContactName(name) }));
          const updatedContact = selectContactById(store.getState(), contactId);

          if (updatedContact === undefined) {
            throw new Error("Contact not found");
          }

          return updatedContact;
        },
      },
      deletion: {
        deleteContact: async contactIdToDelete => {
          dispatch(deleteContactAction(contactIdToDelete));
        },
      },
    }),
    [dispatch, store],
  );
}
