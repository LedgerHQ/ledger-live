import type {
  Contact,
  ContactAddress,
  ContactAddressId,
  ContactId,
  ContactInput,
} from "@domain/entity-contact";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { ContactSignerValidationPort } from "../../../platform/contactSignerValidationPort";
import type { ContactAddressDetailAsset, ContactAddressDetailNetwork } from "../types";

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

export type ContactAddressDeletionInput = Readonly<{
  contactId: ContactId;
  addressId: ContactAddressId;
}>;

export type ContactAddressDeletionPort = Readonly<{
  deleteAddress(input: ContactAddressDeletionInput): Promise<void>;
}>;

export type ContactAddressDetailActionsPorts = Readonly<{
  deletion: ContactAddressDeletionPort;
}>;

export type ContactAddressDetailEditFlowPorts = ContactAddressDetailActionsPorts &
  Readonly<{
    signerValidation: ContactSignerValidationPort;
  }>;

/** Injected by app wiring. */
export type ContactAddressDetailPort = Readonly<{
  resolveNetwork(currencyId: ContactAddress["currencyId"]): ContactAddressDetailNetwork;
  resolveAsset(currencyId: ContactAddress["currencyId"]): ContactAddressDetailAsset;
  resolveQrPayload(contactAddress: ContactAddress): string;
}>;
