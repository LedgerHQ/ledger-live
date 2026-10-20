import type { ContactAddress } from "@domain/entity-contact";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { ContactAddressDeletionPort } from "@features/flow-contacts-delete-address";
import type { ContactDeletionPort } from "@features/flow-contacts-delete-contact";
import type { ContactAddressEditPort, ContactEditPort } from "@features/platform-contacts";
import type { ContactSignerValidationPort } from "../platform/contactSignerValidationPort";
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
