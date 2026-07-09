import { contact } from "@domain/entity-contact";
import { mockContact } from "@domain/entity-contact/schema.mock";
import type { Contact, ContactId } from "@domain/entity-contact";
import type { ContactEditPort, ContactEditRequirement, ContactRenameInput } from "../../contracts";

export function createMockContactEditPort(contacts: Map<ContactId, Contact>): ContactEditPort {
  return {
    async getContactEditRequirement(contactId: ContactId): Promise<ContactEditRequirement> {
      const selectedContact = contacts.get(contactId) ?? mockContact({ id: contactId });

      return selectedContact.addresses.length > 0
        ? { type: "confirmation-required", reason: "contact-has-address" }
        : { type: "direct", reason: "contact-has-no-address" };
    },
    async renameContact(input: ContactRenameInput): Promise<Contact> {
      const selectedContact = contacts.get(input.contactId) ?? mockContact({ id: input.contactId });
      const renamedContact = contact({
        ...selectedContact,
        name: input.name,
      });

      contacts.set(renamedContact.id, renamedContact);

      return renamedContact;
    },
  };
}
