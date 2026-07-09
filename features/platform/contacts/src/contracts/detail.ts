import type { Contact, ContactId } from "@domain/entity-contact";

export type ContactDetailState = Readonly<{
  contact: Contact;
}>;

export type ContactDetailPort = Readonly<{
  loadContactDetail(contactId: ContactId): Promise<ContactDetailState>;
}>;
