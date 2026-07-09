import type { Contact, ContactId } from "@domain/entity-contact";
import type {
  ContactListItem,
  ContactsListPort,
  ContactsListState,
  ContactsListStatus,
} from "../../contracts";
import { sortContactsByName } from "./sorting";
import { getMeContact } from "./state";

export function createMockContactsListPort(contacts: Map<ContactId, Contact>): ContactsListPort {
  return {
    async loadContactsList(query = ""): Promise<ContactsListState> {
      const normalizedQuery = query.trim().toLowerCase();
      const me = getMeContact(contacts);
      const savedContacts = [...contacts.values()]
        .filter(contact => !contact.isMe)
        .sort(sortContactsByName);
      const filteredContacts =
        normalizedQuery.length === 0
          ? savedContacts
          : savedContacts.filter(contact => contact.name.toLowerCase().includes(normalizedQuery));

      return {
        me: toContactListItem(me),
        contacts: filteredContacts.map(toContactListItem),
        status: getContactsListStatus(filteredContacts, normalizedQuery),
      };
    },
  };
}

function getContactsListStatus(
  contacts: readonly Contact[],
  normalizedQuery: string,
): ContactsListStatus {
  if (contacts.length > 0) {
    return "results";
  }

  return normalizedQuery.length > 0 ? "no-results" : "empty";
}

function toContactListItem(contact: Contact): ContactListItem {
  return {
    id: contact.id,
    isMe: contact.isMe,
    name: contact.name,
    addressCount: contact.addresses.length,
  };
}
