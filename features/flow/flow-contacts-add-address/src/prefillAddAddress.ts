import type { ContactAddress, ContactId } from "@domain/entity-contact";
import type {
  AddAddressCurrencySelection,
  AddAddressNetworkContext,
  PrefillAddAddressInvalidReason,
} from "./state/types";

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
      error: PrefillAddAddressInvalidReason;
    }>
  | Readonly<{ status: "unavailable" }>
  | Readonly<{ status: "confirmation_failed" }>;
