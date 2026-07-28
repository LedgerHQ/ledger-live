import type { ContactAddressId } from "@domain/entity-contact";
import type {
  ContactDetailAddressNetworkGroup,
  ContactDetailAddressRow,
} from "../types";

export type ContactAddressDetailSelection = Readonly<{
  row: ContactDetailAddressRow;
  network: ContactDetailAddressNetworkGroup;
}>;

export function findContactAddressDetailSelection(
  addressGroups: readonly ContactDetailAddressNetworkGroup[],
  addressId: ContactAddressId,
): ContactAddressDetailSelection | undefined {
  for (const group of addressGroups) {
    const row = group.rows.find(addressRow => addressRow.addressId === addressId);

    if (row !== undefined) {
      return { row, network: group };
    }
  }

  return undefined;
}
