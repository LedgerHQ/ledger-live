import type { Contact, ContactAddress, ContactId, ContactInput } from "@domain/entity-contact";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";

export type ContactAddressCurrencyPort = Readonly<{
  resolveNetworkId(currencyId: ContactAddress["currencyId"]): CryptoCurrency["id"] | undefined;
}>;

export type ContactRenameInput = Readonly<{
  contactId: ContactId;
  name: ContactInput["name"];
}>;

export type ContactEditPort = Readonly<{
  renameContact(input: ContactRenameInput): Promise<Contact>;
}>;

export type ContactDeletionPort = Readonly<{
  deleteContact(contactId: ContactId): Promise<void>;
}>;

export type ContactDetailActionsPorts = Readonly<{
  edit: ContactEditPort;
  deletion: ContactDeletionPort;
}>;
