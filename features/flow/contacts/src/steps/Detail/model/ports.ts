import type {
  Contact,
  ContactAddress,
  ContactId,
  ContactInput,
} from "@domain/entity-contact";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { ContactAddressDetailAsset, ContactAddressDetailNetwork } from "../types";

/** Injected by app wiring; aligns with the future @features/platform-contacts contract. */
export type ContactAddressCurrencyPort = Readonly<{
  resolveNetworkId(currencyId: ContactAddress["currencyId"]): CryptoCurrency["id"] | undefined;
}>;

export type ContactRenameInput = Readonly<{
  contactId: ContactId;
  name: ContactInput["name"];
}>;

/** Injected by app wiring; aligns with the future @features/platform-contacts contract. */
export type ContactEditPort = Readonly<{
  renameContact(input: ContactRenameInput): Promise<Contact>;
}>;

/** Injected by app wiring; aligns with the future @features/platform-contacts contract. */
export type ContactDeletionPort = Readonly<{
  deleteContact(contactId: ContactId): Promise<void>;
}>;

export type ContactDetailActionsPorts = Readonly<{
  edit: ContactEditPort;
  deletion: ContactDeletionPort;
}>;

/** Injected by app wiring; aligns with the future @features/platform-contacts contract. */
export type ContactAddressDetailPort = Readonly<{
  resolveNetwork(currencyId: ContactAddress["currencyId"]): ContactAddressDetailNetwork;
  resolveAsset(currencyId: ContactAddress["currencyId"]): ContactAddressDetailAsset;
  resolveQrPayload(contactAddress: ContactAddress): string;
}>;
