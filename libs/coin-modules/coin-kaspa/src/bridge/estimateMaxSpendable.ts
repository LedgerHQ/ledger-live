import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { getFeeRate } from "../logic";
import { KaspaAccount, Transaction } from "../types";

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
