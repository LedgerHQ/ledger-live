import type { Contact, ContactId } from "@domain/entity-contact";
import { findOutgoingOperationsToAddresses } from "./findOutgoingOperationsToAddresses";
import type {
  ContactOperationsSummaries,
  ContactOperationsSummary,
  OutgoingOperation,
} from "./types";

function summarizeContact(
  contact: Contact,
  operations: readonly OutgoingOperation[],
): ContactOperationsSummary {
  const matching = findOutgoingOperationsToAddresses(contact.addresses, operations);

  if (matching.length === 0) {
    return { txCount: 0 };
  }

  return {
    txCount: matching.length,
    lastSentAt: matching.reduce((latest, operation) => Math.max(latest, operation.date), 0),
  };
}

/** Every contact gets an entry; those never sent to are `{ txCount: 0 }`. */
export function summarizeOutgoingOperationsByContact(
  contacts: readonly Contact[],
  operations: readonly OutgoingOperation[],
): ContactOperationsSummaries {
  const summaries: Record<ContactId, ContactOperationsSummary> = {};

  for (const contact of contacts) {
    summaries[contact.id] = summarizeContact(contact, operations);
  }

  return summaries;
}
