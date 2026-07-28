import type { Contact } from "@domain/entity-contact";
import type { ContactDetailLabels } from "../types";

export function resolveContactDetailEmptyStateCopy(
  contact: Contact,
  labels: ContactDetailLabels,
): Readonly<{ title: string; description: string }> {
  return {
    title: contact.isMe ? labels.emptyMeTitle : labels.emptyContactTitle(contact.name),
    description: contact.isMe
      ? labels.emptyMeDescription
      : labels.emptyContactDescription(contact.name),
  };
}
