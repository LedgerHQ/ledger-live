import type { AccountBridge } from "@ledgerhq/types-live";
import { KaspaAccount, Transaction } from "../types";
import { BigNumber } from "bignumber.js";
import { getMainAccount } from "@ledgerhq/coin-framework/account/index";

export const estimateMaxSpendable: AccountBridge<
  Transaction,
  KaspaAccount
>["estimateMaxSpendable"] = async ({ account, parentAccount, transaction }) => {
  const mainAccount = getMainAccount(account, parentAccount);

  if (!mainAccount) {
    return BigNumber(0);
  }
  return mainAccount.spendableBalance.minus(506).minus(1118 * mainAccount.activeAddressCount);
};
