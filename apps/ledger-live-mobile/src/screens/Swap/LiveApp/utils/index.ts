import { Transaction } from "@ledgerhq/live-common/generated/types";

import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

export const convertToNonAtomicUnit = ({
  amount,
  account,
}: {
  amount?: BigNumber;
  account: AccountLike;
}) => {
  const fromMagnitude =
    account.type === "TokenAccount"
      ? account.token.units[0].magnitude || 0
      : account.currency?.units[0].magnitude || 0;
  return amount?.shiftedBy(-fromMagnitude);
};

export const getCustomFeesPerFamily = (transaction: Transaction) => {
  switch (transaction.family) {
    case "evm": {
      return {
        maxFeePerGas: transaction.maxFeePerGas,
        maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
        gasPrice: transaction.gasPrice,
      };
    }
    case "bitcoin": {
      return {
        feePerByte: transaction.feePerByte,
        utxoStrategy: transaction.utxoStrategy,
      };
    }
    default:
      if ("fees" in transaction) {
        return {
          fees: transaction.fees,
        };
      }
      return {
        fees: BigNumber(0),
      };
  }
};

export const convertToAtomicUnit = ({
  amount,
  account,
}: {
  amount?: BigNumber;
  account: AccountLike;
}) => {
  const fromMagnitude =
    account.type === "TokenAccount"
      ? account.token.units[0].magnitude || 0
      : account.currency?.units[0].magnitude || 0;
  return amount?.shiftedBy(fromMagnitude);
};
