import BigNumber from "bignumber.js";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { Transaction } from "../types";

/**
 * The amount a send will actually carry.
 *
 * Shared by status and signing so the figure the user approved is the figure
 * that gets signed. Signing used to read it off `getTransactionStatus`, which
 * costs a recipient lookup it has no use for — it does not read `errors` — and
 * which sits in front of the device prompt.
 *
 * The two paths differ under `useAllAmount`: a token transfer sends the
 * sub-account's whole spendable balance, because the fee is owed in CCD by the
 * parent, where a native one has to keep that fee back.
 */
export function resolveSendAmount({
  account,
  transaction,
  tokenAccount,
  estimatedFees,
}: {
  account: Account;
  transaction: Transaction;
  tokenAccount: TokenAccount | undefined;
  estimatedFees: BigNumber;
}): BigNumber {
  if (!transaction.useAllAmount) return new BigNumber(transaction.amount);
  if (tokenAccount) return tokenAccount.spendableBalance;
  return BigNumber.max(0, account.spendableBalance.minus(estimatedFees));
}
