import type { Account } from "@ledgerhq/types-live";
import invariant from "invariant";
import { getFamilySpecificData, type EditType, type Transaction as BtcTransaction } from "../types";
import { buildRbfCancelTx, buildRbfSpeedUpTx } from "./buildRbfTransaction";

/**
 * The replacement of a pending transaction: at the lowest rate that replaces it and that is not
 * below the network's fast rate (see `buildRbfTransaction`).
 */
export const getEditTransactionPatch = ({
  editType,
  transaction,
  account,
}: {
  editType: EditType;
  transaction: BtcTransaction;
  account: Account;
}): Promise<BtcTransaction> => {
  const originalTxId = getFamilySpecificData(transaction).replaceTxId;
  invariant(typeof originalTxId === "string" && originalTxId.length > 0, "replaceTxId is required");
  return editType === "speedup"
    ? buildRbfSpeedUpTx(account, originalTxId)
    : buildRbfCancelTx(account, originalTxId);
};
