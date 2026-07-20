import type { Contact, ContactInput } from "@domain/entity-contact";

export type ContactCreationInput = Readonly<{
  name: ContactInput["name"];
}>;

/** Injected by app wiring; aligns with the future @features/platform-contacts contract. */
export type ContactCreationPort = Readonly<{
  createContact(input: ContactCreationInput): Promise<Contact>;
}>;
