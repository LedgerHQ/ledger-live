import type { Contact } from "@domain/entity-contact";
import type { ContactOperationsSummaries } from "./types";

/**
 * Pay order: most recently sent to first, then never-sent contacts newest added first. "Last added"
 * relies on the input being the contacts store order, where a new contact is appended (higher index
 * means added more recently).
 */
export function sortContactsByLastSentThenLastAdded(
  contacts: readonly Contact[],
  summaries: ContactOperationsSummaries,
): Contact[] {
  return contacts
    .map((contact, index) => ({
      contact,
      index,
      lastSentAt: summaries[contact.id]?.lastSentAt ?? 0,
    }))
    .sort((left, right) => {
      if (left.lastSentAt !== right.lastSentAt) {
        return right.lastSentAt - left.lastSentAt;
      }
      return right.index - left.index;
    })
    .map(({ contact }) => contact);
}
