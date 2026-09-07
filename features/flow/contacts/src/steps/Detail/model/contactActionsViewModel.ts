import type { Contact } from "@domain/entity-contact";
import { resolveContactEditRequirement, isSignerConfirmationRequired } from "./editRequirement";
import type { ContactDetailEditIntent, ContactDetailEditSignerValidationLookup } from "../types";

export function resolveContactEditSignerValidationLookup(
  contact: Contact,
): ContactDetailEditSignerValidationLookup | undefined {
  const firstAddress = contact.addresses[0];

  return firstAddress === undefined
    ? undefined
    : { contactId: contact.id, addressId: firstAddress.id };
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

export function isSignerRequiredForContactEdit(
  editIntent: ContactDetailEditIntent | undefined,
): boolean {
  return isSignerConfirmationRequired(editIntent?.editRequirement);
}
