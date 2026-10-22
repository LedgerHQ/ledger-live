import type { ContactAddressId, ContactId } from "@domain/entity-contact";
import type { ContactAddressDeleteIntent, ContactAddressDeleteLifecycle } from "../types";

export function createContactAddressDeleteIntent(
  contactId: ContactId,
  addressId: ContactAddressId,
): ContactAddressDeleteIntent {
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
