import type { Contact, ContactId } from "@domain/entity-contact";
import { findContactOperationsToAddresses } from "./findContactOperationsToAddresses";
import type {
  ContactOperation,
  ContactOperationsSummaries,
  ContactOperationsSummary,
} from "./types";

function summarizeContact(
  contact: Contact,
  operations: readonly ContactOperation[],
): ContactOperationsSummary {
  const matching = findContactOperationsToAddresses(contact.addresses, operations);

  if (matching.length === 0) {
    return { txCount: 0 };
  }

  const lastSentAt = matching
    .filter(operation => operation.type === "OUT")
    .reduce((latest, operation) => Math.max(latest, operation.date), 0);

  if (lastSentAt > 0) {
    return { txCount: matching.length, lastSentAt };
  }

  return { txCount: matching.length };
}

/**
 * Like {@link summarizeOutgoingOperationsByContact} but counts both incoming and outgoing transfers,
 * so the Pay contacts table matches the contact-filtered History list. `lastSentAt` still derives
 * from `OUT` matches only, so the Pay ordering stays "who did I last pay".
 */
export function summarizeContactOperationsByContact(
  contacts: readonly Contact[],
  operations: readonly ContactOperation[],
): ContactOperationsSummaries {
  const summaries: Record<ContactId, ContactOperationsSummary> = {};

  for (const contact of contacts) {
    summaries[contact.id] = summarizeContact(contact, operations);
  }

  return summaries;
}
