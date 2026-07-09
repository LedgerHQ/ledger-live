import type { Contact, ContactId, ContactInput } from "@domain/entity-contact";

export type ContactRenameInput = Readonly<{
  contactId: ContactId;
  name: ContactInput["name"];
}>;

export type ContactEditRequirement =
  | Readonly<{
      type: "direct";
      reason: "contact-has-no-address";
    }>
  | Readonly<{
      type: "confirmation-required";
      reason: "contact-has-address";
    }>;

export type ContactEditPort = Readonly<{
  getContactEditRequirement(contactId: ContactId): Promise<ContactEditRequirement>;
  renameContact(input: ContactRenameInput): Promise<Contact>;
}>;
