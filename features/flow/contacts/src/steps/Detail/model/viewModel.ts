import type { Contact, ContactAddressId, ContactId } from "@domain/entity-contact";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { ContactAddressCurrencyPort } from "./ports";
import { sortContactAddressesByNetwork } from "./sortContactAddressesByNetwork";
import type { ContactDetailAddressRow, PopulatedContactDetailViewModel } from "../types";

export function createContactDetailAddressRowIntent(
  contactId: ContactId,
  addressId: ContactAddressId,
): ContactDetailAddressRow["intent"] {
  return {
    type: "open-address-detail",
    contactId,
    addressId,
  };
}

function createContactDetailAddressRow(
  contact: Contact,
  address: Contact["addresses"][number],
): ContactDetailAddressRow {
  return {
    addressId: address.id,
    label: address.label,
    address: address.address,
    currencyId: address.currencyId,
    intent: createContactDetailAddressRowIntent(contact.id, address.id),
  };
}

export function createPopulatedContactDetailViewModel(
  contact: Contact,
  currencyPort: ContactAddressCurrencyPort,
  networkIds?: readonly CryptoCurrency["id"][],
): PopulatedContactDetailViewModel {
  const orderedAddresses = sortContactAddressesByNetwork(
    contact.addresses,
    currencyPort,
    networkIds,
  );

  return {
    displayMode: "populated",
    contact,
    addressCount: contact.addresses.length,
    addressRows: orderedAddresses.map(address => createContactDetailAddressRow(contact, address)),
  };
}
