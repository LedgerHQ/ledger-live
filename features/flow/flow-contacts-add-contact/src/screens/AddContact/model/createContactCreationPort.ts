import { addContact, contact } from "@domain/entity-contact";
import type { ContactCreationPort } from "./ports";

export type ContactCreationDispatch = (action: ReturnType<typeof addContact>) => void;

export type CreateContactCreationPortOptions = Readonly<{
  dispatch: ContactCreationDispatch;
  generateId: () => string;
}>;

/**
 * Default `ContactCreationPort` shared by every host. It builds the new contact and applies it with
 * the injected `dispatch`. The `contactsSlice` is the Ledger Sync (Cloud Sync) source of truth, so
 * this dispatch both updates local state and propagates the contact across devices — see
 * `@domain/entity-contact` `cloudSyncModule`.
 *
 * The only host-owned policy is `generateId` (e.g. uuid): the contact id is minted client-side.
 */
export function createContactCreationPort({
  dispatch,
  generateId,
}: CreateContactCreationPortOptions): ContactCreationPort {
  return {
    createContact: async ({ name }) => {
      const createdContact = contact({
        id: `contact-${generateId()}`,
        isMe: false,
        name,
        addresses: [],
      });

      dispatch(addContact(createdContact));

      return createdContact;
    },
  };
}
