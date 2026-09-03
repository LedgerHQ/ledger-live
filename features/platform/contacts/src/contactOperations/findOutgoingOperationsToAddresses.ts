import { addressesMatch } from "./addressesMatch";
import type { OutgoingOperation } from "./types";

type MatchableAddress = Readonly<{ address: string; currencyId: string }>;

function matchesAddress(operation: OutgoingOperation, address: MatchableAddress): boolean {
  return (
    address.currencyId === operation.currencyId &&
    addressesMatch(address.address, operation.recipientAddress)
  );
}

/**
 * The single matching primitive: summaries fold its result and a future History filter can reuse it.
 * Requiring the same currency stops the same address string on two networks from colliding.
 */
export function findOutgoingOperationsToAddresses(
  addresses: readonly MatchableAddress[],
  operations: readonly OutgoingOperation[],
): OutgoingOperation[] {
  if (addresses.length === 0) {
    return [];
  }

  return operations.filter(operation =>
    addresses.some(address => matchesAddress(operation, address)),
  );
}
