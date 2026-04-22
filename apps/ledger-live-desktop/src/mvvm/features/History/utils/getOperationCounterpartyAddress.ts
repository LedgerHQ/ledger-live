import type { Operation, OperationType } from "@ledgerhq/types-live";

type AddressDirection = "from" | "to";

const SENDER_TYPES = new Set<OperationType>(["IN", "REVEAL", "REWARD_PAYOUT"]);

/**
 * Resolves the counterparty address to display for an operation,
 * matching the legacy AddressCell default lenses.
 */
export function getOperationCounterpartyAddress(operation: Operation): string {
  if (SENDER_TYPES.has(operation.type)) {
    return operation.senders[0] ?? "";
  }
  return operation.recipients[0] ?? "";
}

export function getAddressDirection(type: OperationType): AddressDirection {
  return SENDER_TYPES.has(type) ? "from" : "to";
}
