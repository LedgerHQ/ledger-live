import { addressesMatch } from "./addressesMatch";
import type { ContactOperation } from "./types";

type MatchableAddress = Readonly<{ address: string; currencyId: string }>;

function counterpartyAddresses(operation: ContactOperation): readonly string[] {
  return operation.type === "IN" ? operation.senders : operation.recipients;
}

function matchesAddress(operation: ContactOperation, address: MatchableAddress): boolean {
  return (
    address.currencyId === operation.currencyId &&
    counterpartyAddresses(operation).some(counterparty =>
      addressesMatch(address.address, counterparty),
    )
  );
}

/**
 * Bidirectional counterpart of {@link findOutgoingOperationsToAddresses}: keeps every `IN`/`OUT`
 * operation whose counterparty (senders for `IN`, recipients for `OUT`) matches one of the
 * addresses on the same currency. Requiring the same currency stops the same address string on two
 * networks from colliding.
 */
export function findContactOperationsToAddresses(
  addresses: readonly MatchableAddress[],
  operations: readonly ContactOperation[],
): ContactOperation[] {
  if (addresses.length === 0) {
    return [];
  }

  return operations.filter(operation =>
    addresses.some(address => matchesAddress(operation, address)),
  );
}
