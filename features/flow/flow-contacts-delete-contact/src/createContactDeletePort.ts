import { deleteContact as deleteContactAction } from "@domain/entity-contact";
import type { ContactDeletionPort } from "./model/ports";

type CreateContactDeletePortDeps = Readonly<{
  dispatch: (action: { type: string }) => void;
}>;

export function createContactDeletePort({
  dispatch,
}: CreateContactDeletePortDeps): ContactDeletionPort {
  return {
    deleteContact: async contactId => {
      dispatch(deleteContactAction(contactId));
    },
  };
}
