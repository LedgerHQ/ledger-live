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

export function resolveContactEditRequirement(contact: Contact): ContactEditRequirement {
  return contact.addresses.length > 0
    ? { type: "confirmation-required", reason: "contact-has-address" }
    : { type: "direct", reason: "contact-has-no-address" };
}
