import type { Contact } from "@domain/entity-contact";

export function sortContactsByName(left: Contact, right: Contact): number {
  return left.name.localeCompare(right.name);
}
