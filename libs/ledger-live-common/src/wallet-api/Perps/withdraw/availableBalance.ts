import type BigNumber from "bignumber.js";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "../../../account";

/** Perps available balance in whole USDC: the HyperCore account value minus used margin. */
export function getPerpsAvailableBalance(account: AccountLike): BigNumber {
  return account.spendableBalance.shiftedBy(-getAccountCurrency(account).units[0].magnitude);
}
