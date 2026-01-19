import { isTokenAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { getMainAccount } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { AccountBridge } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { HEDERA_OPERATION_TYPES } from "../constants";
import { estimateFees } from "../logic/estimateFees";
import type { Transaction } from "../types";

export const estimateMaxSpendable: AccountBridge<Transaction>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
}) => {
  const mainAccount = getMainAccount(account, parentAccount);
  const isTokenTransaction = isTokenAccount(account);
  const balance = account.balance;

  if (isTokenTransaction) {
    return Promise.resolve(balance);
  }

  const estimatedFees = await estimateFees({
    currencyId: mainAccount.currency.id,
    operationType: HEDERA_OPERATION_TYPES.CryptoTransfer,
  });
  let maxSpendable = balance.minus(estimatedFees.tinybars);

  // set max spendable to 0 if negative
  // for cases where the user's account balance is smaller than the estimated fee
  if (maxSpendable.isLessThan(0)) {
    maxSpendable = new BigNumber(0);
  }

  return Promise.resolve(maxSpendable);
};
