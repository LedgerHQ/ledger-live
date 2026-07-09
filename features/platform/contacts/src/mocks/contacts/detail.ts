import { mockContact } from "@domain/entity-contact/schema.mock";
import type { Contact, ContactId } from "@domain/entity-contact";
import type { ContactDetailPort, ContactDetailState } from "../../contracts";
import { sortAddressesByNetwork } from "../addresses/sorting";

export function createMockLoadContactDetail(
  contacts: ReadonlyMap<ContactId, Contact>,
): ContactDetailPort["loadContactDetail"] {
  return async (contactId: ContactId): Promise<ContactDetailState> => {
    const selectedContact = contacts.get(contactId) ?? mockContact({ id: contactId });

    return {
      contact: {
        ...selectedContact,
        addresses: sortAddressesByNetwork(selectedContact.addresses),
      },
    };
  };
}

export function createMockContactDetailPort(
  loadContactDetail: ContactDetailPort["loadContactDetail"],
): ContactDetailPort {
  return {
    loadContactDetail,
  };
}
