import type { ContactAddress, ContactId } from "@domain/entity-contact";
import { CONTACT_ADDRESS_EDIT_REQUIREMENT } from "./editRequirement";
import type { ContactAddressDetailEditIntent, ContactAddressDetailSendIntent } from "../types";

export function createContactAddressDetailSendIntent(
  contactId: ContactId,
  contactAddress: ContactAddress,
): ContactAddressDetailSendIntent {
  return {
    type: "send-address",
    contactId,
    addressId: contactAddress.id,
    currencyId: contactAddress.currencyId,
    address: contactAddress.address,
  };
}

export function createContactAddressDetailEditIntent(
  contactId: ContactId,
  contactAddress: ContactAddress,
): ContactAddressDetailEditIntent {
  return {
    type: "edit-address",
    contactId,
    addressId: contactAddress.id,
    editRequirement: CONTACT_ADDRESS_EDIT_REQUIREMENT,
  };
}
