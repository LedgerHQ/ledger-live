import type { AccountTransaction } from "@ledgerhq/concordium-sdk-adapter";

/**
 * Represents an AccountTransaction with energy for hardware wallet signing.
 * Extends SDK AccountTransaction with energy amount field.
 */
export interface AccountTransactionWithEnergy extends AccountTransaction {
  energyAmount: bigint;
}
