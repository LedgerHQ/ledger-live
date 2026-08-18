import type { Contact, ContactId } from "@domain/entity-contact";
import { resolveContactEditRequirement, isSignerConfirmationRequired } from "./editRequirement";
import type {
  ContactDeleteLifecycle,
  ContactDetailDeleteIntent,
  ContactDetailEditIntent,
  ContactDetailEditSignerValidationLookup,
} from "../types";

export function resolveContactEditSignerValidationLookup(
  contact: Contact,
): ContactDetailEditSignerValidationLookup | undefined {
  const firstAddress = contact.addresses[0];

  if (firstAddress === undefined) {
    return undefined;
  }

  return {
    contactId: contact.id,
    addressId: firstAddress.id,
  };
}

export function createContactDetailEditIntent(contact: Contact): ContactDetailEditIntent {
  const editRequirement = resolveContactEditRequirement(contact);

  return {
    type: "edit-contact",
    contactId: contact.id,
    editRequirement,
    signerValidationLookup: isSignerConfirmationRequired(editRequirement)
      ? resolveContactEditSignerValidationLookup(contact)
      : undefined,
  };
}

export function createContactDetailDeleteIntent(contactId: ContactId): ContactDetailDeleteIntent {
  return {
    type: "delete-contact",
    contactId,
  };
}

export function createIdleContactDeleteLifecycle(): ContactDeleteLifecycle {
  return { status: "idle" };
}

export function createOpenContactDeleteLifecycle(contactId: ContactId): ContactDeleteLifecycle {
  return { status: "open", contactId };
}

export function createSuccessContactDeleteLifecycle(contactId: ContactId): ContactDeleteLifecycle {
  return { status: "success", contactId };
}

export function createErrorContactDeleteLifecycle(contactId: ContactId): ContactDeleteLifecycle {
  return { status: "error", contactId };
}

export function isSignerRequiredForContactEdit(
  editIntent: ContactDetailEditIntent | undefined,
): boolean {
  return isSignerConfirmationRequired(editIntent?.editRequirement);
}
