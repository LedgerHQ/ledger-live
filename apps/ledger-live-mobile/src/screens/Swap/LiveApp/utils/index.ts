import { Transaction } from "@ledgerhq/live-common/generated/types";

import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TransformableObject = Record<string, any>;

/**
 * Recursively transforms all number strings in an object into BigNumber instances.
 * @param {TransformableObject} obj - The object to transform.
 * @returns {TransformableObject} - The transformed object with BigNumber instances.
 */
export function transformToBigNumbers(obj: TransformableObject): TransformableObject {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  const transformedObj: TransformableObject = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === "string" && !isNaN(value as unknown as number)) {
        transformedObj[key] = new BigNumber(value);
      } else if (typeof value === "object") {
        transformedObj[key] = transformToBigNumbers(value);
      } else {
        transformedObj[key] = value;
      }
    }
  }

  return transformedObj;
}

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
