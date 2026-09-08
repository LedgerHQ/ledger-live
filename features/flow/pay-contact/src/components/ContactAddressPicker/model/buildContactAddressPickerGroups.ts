import type { Contact, ContactAddress } from "@domain/entity-contact";
import {
  createPopulatedContactDetailViewModel,
  defaultContactAddressCurrencyPort,
  resolveContactAddressIconProps,
  truncateContactAddress,
} from "@features/flow-contacts/model";
import type { ContactAddressPickerNetworkGroup } from "../../../types";

export function buildContactAddressPickerGroups(
  contact: Contact,
): readonly ContactAddressPickerNetworkGroup[] {
  if (contact.addresses.length === 0) {
    return [];
  }

  const addressById = new Map<ContactAddress["id"], ContactAddress>(
    contact.addresses.map(address => [address.id, address]),
  );
  const { addressGroups } = createPopulatedContactDetailViewModel(
    contact,
    defaultContactAddressCurrencyPort,
  );

  return addressGroups.map(group => ({
    networkId: group.networkId,
    networkName: group.networkName,
    networkTicker: group.networkTicker,
    rows: group.rows.map(row => {
      const contactAddress = addressById.get(row.addressId);

      if (contactAddress === undefined) {
        throw new Error(`Missing contact address for id "${row.addressId}"`);
      }

      return {
        addressId: row.addressId,
        label: row.label,
        address: truncateContactAddress(row.address),
        icon: resolveContactAddressIconProps(row.currencyId, row.label, group.networkId),
        contactAddress,
      };
    }),
  }));
}
