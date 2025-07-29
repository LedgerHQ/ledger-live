import BigNumber from "bignumber.js";
import { Account as DetailedAccount } from "@ledgerhq/native-ui/pre-ldls/index";

/**
 *
 * @param accounts - List of DetailedAccount to sort
 * @returns Sorted list of DetailedAccount by fiat value balance in descending order
 *
 * This function sorts the accounts based on their fiat value balance in descending order.
 */
export const sortAccountsByFiatValue = (accounts: DetailedAccount[]) => {
  return [...accounts].sort((a, b) => {
    const numericBalanceA = a.fiatValue?.replace(/[^0-9.-]+/g, "") ?? "0";
    const numericBalanceB = b.fiatValue?.replace(/[^0-9.-]+/g, "") ?? "0";

    const balanceA = BigNumber(numericBalanceA);
    const balanceB = BigNumber(numericBalanceB);

    return balanceB.minus(balanceA).toNumber();
  });
};
