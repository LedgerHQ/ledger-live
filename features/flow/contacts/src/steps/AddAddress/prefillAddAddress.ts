import type { ContactAddress, ContactId } from "@domain/entity-contact";
import type { AddAddressCurrencySelection, AddAddressNetworkContext } from "./types";

/**
 * Public entry params for the prefilled Add Address flow (MAD bypass).
 * Consumers such as Send provide a known contact, destination, currency, and network.
 */
export type OpenPrefillAddAddressParams = Readonly<{
  contactId: ContactId;
  address: string;
  currency: AddAddressCurrencySelection;
  network: AddAddressNetworkContext;
}>;

export type OpenPrefillAddAddressResult =
  | Readonly<{ status: "saved"; address: ContactAddress }>
  | Readonly<{ status: "cancelled" }>
  | Readonly<{
      status: "invalid_address";
      error: "invalid_format" | "domain_not_found" | "sanctioned";
    }>
  | Readonly<{ status: "unavailable" }>
  | Readonly<{ status: "confirmation_failed" }>;
