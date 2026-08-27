import type {
  ContactAddress,
  ContactAddressId,
  ContactAddressLabel,
  ContactAddressValue,
  ContactId,
} from "@domain/entity-contact";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { ContactEditPort } from "@features/platform-contacts";
import type { ContactSignerValidationPort } from "../../../platform/contactSignerValidationPort";
import type { ContactAddressDetailAsset, ContactAddressDetailNetwork } from "../types";

export type ContactAddressCurrencyPort = Readonly<{
  resolveNetworkId(currencyId: ContactAddress["currencyId"]): CryptoCurrency["id"] | undefined;
}>;

export type ContactDeletionPort = Readonly<{
  deleteContact(contactId: ContactId): Promise<void>;
}>;

export type ContactDetailActionsDataPorts = Readonly<{
  edit: ContactEditPort;
  deletion: ContactDeletionPort;
}>;

export type ContactDetailActionsPorts = ContactDetailActionsDataPorts &
  Readonly<{
    signerValidation: ContactSignerValidationPort;
  }>;

export type ContactAddressDeletionInput = Readonly<{
  contactId: ContactId;
  addressId: ContactAddressId;
}>;

export type ContactAddressDeletionPort = Readonly<{
  deleteAddress(input: ContactAddressDeletionInput): Promise<void>;
}>;

export type ContactAddressUpdateInput = Readonly<{
  contactId: ContactId;
  addressId: ContactAddressId;
  label: ContactAddressLabel;
  address: ContactAddressValue;
}>;

export type ContactAddressEditPort = Readonly<{
  updateAddress(input: ContactAddressUpdateInput): Promise<ContactAddress>;
}>;

export type ContactAddressDetailActionsDataPorts = Readonly<{
  edit: ContactAddressEditPort;
  deletion: ContactAddressDeletionPort;
}>;

export type ContactAddressDetailActionsPorts = ContactAddressDetailActionsDataPorts &
  Readonly<{
    signerValidation: ContactSignerValidationPort;
  }>;

/** Injected by app wiring. */
export type ContactAddressDetailPort = Readonly<{
  resolveNetwork(currencyId: ContactAddress["currencyId"]): ContactAddressDetailNetwork;
  resolveAsset(currencyId: ContactAddress["currencyId"]): ContactAddressDetailAsset;
  resolveQrPayload(contactAddress: ContactAddress): string;
}>;
