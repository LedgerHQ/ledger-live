import { BaseRawDetailedAccount } from "../types/detailedAccount";

/**
 * Sorts accounts by their fiat value in descending order
 * @param accounts - List of accounts with fiat values to sort
 * @returns Sorted list of accounts by fiat value balance in descending order
 */
export function sortAccountsByFiatValue<T extends BaseRawDetailedAccount>(accounts: T[]): T[] {
  return [...accounts].sort((a, b) => {
    const fiatValueA = a.fiatValue ?? 0;
    const fiatValueB = b.fiatValue ?? 0;
    return fiatValueB - fiatValueA;
  });
}
