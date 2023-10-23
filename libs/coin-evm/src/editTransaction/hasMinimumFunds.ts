import { getEnv } from "@ledgerhq/live-env";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { getEstimatedFees } from "../logic";
import type { Transaction } from "../types/index";

export const hasMinimumFundsToCancel = ({
  mainAccount,
  transactionToUpdate,
}: {
  mainAccount: Account;
  transactionToUpdate: Transaction;
}): boolean => {
  const isEip1559 = transactionToUpdate.type === 2;

  const factor: number = isEip1559
    ? getEnv("EVM_REPLACE_TX_EIP1559_MAXFEE_FACTOR")
    : getEnv("EVM_REPLACE_TX_LEGACY_GASPRICE_FACTOR");

  const feeValue = getEstimatedFees(transactionToUpdate);
  return mainAccount.balance.gt(feeValue.times(factor).integerValue(BigNumber.ROUND_CEIL));
};

export const hasMinimumFundsToSpeedUp = ({
  account,
  mainAccount,
  transactionToUpdate,
}: {
  account: AccountLike;
  mainAccount: Account;
  transactionToUpdate: Transaction;
}): boolean => {
  const isEip1559 = transactionToUpdate.type === 2;

  const factor: number = isEip1559
    ? getEnv("EVM_REPLACE_TX_EIP1559_MAXFEE_FACTOR")
    : getEnv("EVM_REPLACE_TX_LEGACY_GASPRICE_FACTOR");

  const feeValue = getEstimatedFees(transactionToUpdate);
  return mainAccount.balance.gt(
    feeValue
      .times(factor)
      .plus(account.type === "Account" ? transactionToUpdate.amount : 0)
      .integerValue(BigNumber.ROUND_CEIL),
  );
};
