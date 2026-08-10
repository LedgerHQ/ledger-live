import type { Contact } from "@domain/entity-contact";

export type ContactEditRequirement =
  | Readonly<{
      type: "direct";
      reason: "contact-has-no-address";
    }>
  | Readonly<{
      type: "confirmation-required";
      reason: "contact-has-address";
    }>;

export const CONTACT_ADDRESS_EDIT_REQUIREMENT = {
  type: "confirmation-required",
  reason: "contact-has-address",
} as const satisfies ContactEditRequirement;

export const CONTACT_ADDRESS_DELETE_REQUIREMENT = CONTACT_ADDRESS_EDIT_REQUIREMENT;

export function resolveContactEditRequirement(contact: Contact): ContactEditRequirement {
  return contact.addresses.length > 0
    ? { type: "confirmation-required", reason: "contact-has-address" }
    : { type: "direct", reason: "contact-has-no-address" };
}

export function isSignerConfirmationRequired(
  editRequirement: ContactEditRequirement | undefined,
): boolean {
  return editRequirement?.type === "confirmation-required";
}
