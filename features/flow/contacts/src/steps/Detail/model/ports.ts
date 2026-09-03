import type { ContactAddress, ContactAddressId, ContactId } from "@domain/entity-contact";
import type { ContactAddressEditPort, ContactEditPort } from "@features/platform-contacts";
import type { ContactDeletionPort } from "@features/flow-contacts-delete-contact";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { ContactSignerValidationPort } from "../../../platform/contactSignerValidationPort";
import type { ContactAddressDetailAsset, ContactAddressDetailNetwork } from "../types";

export type ContactAddressCurrencyPort = Readonly<{
  resolveNetworkId(currencyId: ContactAddress["currencyId"]): CryptoCurrency["id"] | undefined;
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
