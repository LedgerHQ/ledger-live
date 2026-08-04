import type { Contact, ContactInput } from "@domain/entity-contact";

export type ContactCreationInput = Readonly<{
  name: ContactInput["name"];
}>;

export type ContactCreationPort = Readonly<{
  createContact(input: ContactCreationInput): Promise<Contact>;
}>;
