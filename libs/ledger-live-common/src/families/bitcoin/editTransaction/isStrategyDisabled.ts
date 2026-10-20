import type { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { getMinFees } from "./getMinEditTransactionFees";

/**
 * A strategy is disabled if its fee rate is lower than the minimum fee rate
 * required to replace the original transaction (RBF bump).
 */
export const isStrategyDisabled = ({
  mainAccount,
  transaction,
  feesStrategy,
}: {
  mainAccount: Account;
  transaction: { feePerByte?: BigNumber | null; rbf?: boolean };
  feesStrategy: BigNumber;
}): boolean => {
  // If RBF is explicitly disabled or the original fee rate is unknown, a replacement tx shouldn't be possible.
  if (!transaction.rbf || !transaction.feePerByte || !feesStrategy || feesStrategy.lte(0)) {
    return true;
  }

  const minFees = getMinFees({ mainAccount, feePerByte: transaction.feePerByte });
  return feesStrategy.isLessThan(minFees.feePerByte);
};
