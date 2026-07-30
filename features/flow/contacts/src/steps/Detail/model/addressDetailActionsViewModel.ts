import type { ContactAddress, ContactAddressId, ContactId } from "@domain/entity-contact";
import type {
  ContactAddressDeleteLifecycle,
  ContactAddressDetailDeleteIntent,
  ContactAddressDetailEditIntent,
  ContactAddressDetailSendIntent,
} from "../types";

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
  };
}

export function createContactAddressDetailDeleteIntent(
  contactId: ContactId,
  addressId: ContactAddressId,
): ContactAddressDetailDeleteIntent {
  return {
    type: "delete-address",
    contactId,
    addressId,
  };
}

export function createIdleContactAddressDeleteLifecycle(): ContactAddressDeleteLifecycle {
  return { status: "idle" };
}

export function createOpenContactAddressDeleteLifecycle(
  contactId: ContactId,
  addressId: ContactAddressId,
): ContactAddressDeleteLifecycle {
  return { status: "open", contactId, addressId };
}

export function createSuccessContactAddressDeleteLifecycle(
  contactId: ContactId,
  addressId: ContactAddressId,
): ContactAddressDeleteLifecycle {
  return { status: "success", contactId, addressId };
}

export function createErrorContactAddressDeleteLifecycle(
  contactId: ContactId,
  addressId: ContactAddressId,
): ContactAddressDeleteLifecycle {
  return { status: "error", contactId, addressId };
}
