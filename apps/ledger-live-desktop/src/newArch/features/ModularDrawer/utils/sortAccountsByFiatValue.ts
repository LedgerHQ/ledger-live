import { RawDetailedAccount } from "./formatDetailedAccount";

/**
 *
 * @param accounts - List of RawDetailedAccount to sort
 * @returns Sorted list of RawDetailedAccount by fiat value balance in descending order
 *
 * This function sorts the accounts based on their fiat value balance in descending order.
 */
export const sortAccountsByFiatValue = (accounts: RawDetailedAccount[]) => {
  return [...accounts].sort((a, b) => {
    const balanceA = a.fiatValue ?? 0;
    const balanceB = b.fiatValue ?? 0;

    return balanceB - balanceA;
  });
};
