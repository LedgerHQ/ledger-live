import { contact, ContactIdSchema } from "@domain/entity-contact";
import type { Contact, ContactId } from "@domain/entity-contact";
import type { ContactCreationPort } from "../../contracts";
import { createUniqueMockId } from "../ids";

export function createMockContactCreationPort(
  contacts: Map<ContactId, Contact>,
): ContactCreationPort {
  return {
    async createContact(input): Promise<Contact> {
      const createdContact = contact({
        id: ContactIdSchema.parse(createUniqueMockId("contact", input.name, contacts.keys())),
        isMe: false,
        name: input.name,
        addresses: [],
      });

      contacts.set(createdContact.id, createdContact);

      return createdContact;
    },
  };
}
