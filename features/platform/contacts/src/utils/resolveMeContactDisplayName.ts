import type { Contact } from "@domain/entity-contact";

export function resolveMeContactDisplayName(
  contact: Contact,
  formatMeDisplayName: (name: string) => string,
): string {
  if (!contact.isMe) {
    return contact.name;
  }

  return formatMeDisplayName(contact.name);
}
