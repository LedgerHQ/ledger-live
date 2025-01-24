import type { AccountBridge } from "@ledgerhq/types-live";
import { KaspaAccount, Transaction } from "../types";
import { BigNumber } from "bignumber.js";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import { getFeeRate } from "../logic";

export const estimateMaxSpendable: AccountBridge<
  Transaction,
  KaspaAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);

  if (!mainAccount) {
    return BigNumber(0);
  }
  const feeRate: BigNumber = getFeeRate(transaction);

  const maxSpendable: BigNumber = mainAccount.spendableBalance
    .minus(506 * feeRate.toNumber())
    .minus(1118 * mainAccount.activeAddressCount * feeRate.toNumber());

  return maxSpendable.lt(0) ? BigNumber(0) : maxSpendable;
};
