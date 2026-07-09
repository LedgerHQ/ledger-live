import type { Contact, ContactAddress, ContactId } from "@domain/entity-contact";

export type ContactDetailState = Readonly<{
  contact: Contact;
  addresses: readonly ContactAddress[];
}>;

export type ContactDetailPort = Readonly<{
  loadContactDetail(contactId: ContactId): Promise<ContactDetailState>;
}>;
