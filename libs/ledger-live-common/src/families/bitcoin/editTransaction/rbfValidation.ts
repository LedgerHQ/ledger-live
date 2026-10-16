import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { getFamilySpecificData, type Transaction as BtcTransaction } from "../types";
import { getReplacementEstimate } from "./replacement";

const ZERO = new BigNumber(0);

/**
 * Original transaction fee rate (sat/vB). Used when validating RBF replacement and the original
 * transaction's own rate is unknown (not stored in the operation).
 */
export const getOriginalTxFeeRateSatVb = async (
  account: Account,
  originalTxId: string,
): Promise<BigNumber | null> => {
  try {
    const { originalFeePerByte } = await getReplacementEstimate(account, originalTxId);
    return originalFeePerByte === undefined ? null : new BigNumber(originalFeePerByte.toString());
  } catch {
    return null;
  }
};

/**
 * Extra fee (in sats) required by common Bitcoin Core RBF policy: the absolute fee must grow by
 * the incremental relay fee times the size, and the rate by the incremental relay fee.
 */
export const getAdditionalFeeRequiredForRbf = async ({
  mainAccount,
  transactionToUpdate,
}: {
  mainAccount: Account;
  transactionToUpdate: BtcTransaction;
}): Promise<BigNumber> => {
  const { replaceTxId } = getFamilySpecificData(transactionToUpdate);
  if (!replaceTxId) return ZERO;
  const { minReplacementFee, originalFee } = await getReplacementEstimate(mainAccount, replaceTxId);
  if (minReplacementFee === undefined || originalFee === undefined) return ZERO;
  return BigNumber.max(new BigNumber((minReplacementFee - originalFee).toString()), ZERO);
};
