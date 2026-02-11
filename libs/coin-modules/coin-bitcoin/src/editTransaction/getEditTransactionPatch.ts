import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import type { EditType, Transaction as BtcTransaction } from "../types";
import { buildRbfCancelTx, buildRbfSpeedUpTx } from "../buildRbfTransaction";

const getNetworkFastFeePerByte = (tx: Partial<BtcTransaction>): BigNumber | null => {
  const items = tx.networkInfo?.feeItems?.items;
  if (!items || items.length === 0) return null;

  const fast = items.find(item => item.speed === "fast");
  return fast?.feePerByte ?? null;
};

const getSpeedupPatch = async ({
  transaction,
  account,
}: {
  transaction: BtcTransaction;
  account: Account;
}): Promise<BtcTransaction> => {
  const originalTxId = transaction.replaceTxId;
  invariant(typeof originalTxId === "string" && originalTxId.length > 0, "replaceTxId is required");

  // Build a baseline RBF replacement intent (min replacement feerate + inputs overlap etc.)
  const nextTx = await buildRbfSpeedUpTx(account, originalTxId);

  /**
   * Ensure the default fee rate is not only "RBF-minimum", but also not below
   * current network conditions (otherwise the replacement could still be stuck).
   */
  const fastFeePerByte = getNetworkFastFeePerByte(nextTx);

  if (fastFeePerByte === null) {
    return nextTx;
  }

  const currentFeePerByte = nextTx.feePerByte ?? fastFeePerByte;

  const feePerByte = BigNumber.maximum(currentFeePerByte, fastFeePerByte).integerValue(
    BigNumber.ROUND_CEIL,
  );

  return {
    ...nextTx,
    feePerByte,
    // If we end up exactly on the "fast" value, default to the fast strategy.
    feesStrategy: feePerByte.isEqualTo(fastFeePerByte) ? "fast" : nextTx.feesStrategy,
  };
};

// Cancel differs from speedup: it sends funds back to the account's change address instead of the original recipient.
const getCancelPatch = async ({
  transaction,
  account,
}: {
  transaction: BtcTransaction;
  account: Account;
}): Promise<BtcTransaction> => {
  const originalTxId = transaction.replaceTxId;
  invariant(typeof originalTxId === "string" && originalTxId.length > 0, "replaceTxId is required");

  // Build a baseline RBF cancel intent (min replacement feerate + inputs overlap etc.)
  const nextTx = await buildRbfCancelTx(account, originalTxId);

  /**
   * Ensure the default fee rate is not only "RBF-minimum", but also not below
   * current network conditions (otherwise the replacement could still be stuck).
   */
  const fastFeePerByte = getNetworkFastFeePerByte(nextTx);

  if (fastFeePerByte === null) {
    return nextTx;
  }

  const currentFeePerByte = nextTx.feePerByte ?? fastFeePerByte;

  const feePerByte = BigNumber.maximum(currentFeePerByte, fastFeePerByte).integerValue(
    BigNumber.ROUND_CEIL,
  );

  return {
    ...nextTx,
    feePerByte,
    // If we end up exactly on the "fast" value, default to the fast strategy.
    feesStrategy: feePerByte.isEqualTo(fastFeePerByte) ? "fast" : nextTx.feesStrategy,
  };
};

export const getEditTransactionPatch = ({
  editType,
  transaction,
  account,
}: {
  editType: EditType;
  transaction: BtcTransaction;
  account: Account;
}): Promise<BtcTransaction> => {
  return editType === "speedup"
    ? getSpeedupPatch({ transaction, account })
    : getCancelPatch({ transaction, account });
};
