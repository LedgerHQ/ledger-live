import type { Contact, ContactId } from "@domain/entity-contact";
import { resolveContactEditRequirement } from "./editRequirement";
import type {
  ContactDeleteLifecycle,
  ContactDetailDeleteIntent,
  ContactDetailEditIntent,
} from "../types";

export function createContactDetailEditIntent(contact: Contact): ContactDetailEditIntent {
  return {
    type: "edit-contact",
    contactId: contact.id,
    editRequirement: resolveContactEditRequirement(contact),
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
  return editIntent?.editRequirement.type === "confirmation-required";
}
