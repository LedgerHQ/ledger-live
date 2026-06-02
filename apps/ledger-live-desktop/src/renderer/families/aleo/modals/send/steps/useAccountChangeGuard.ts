import { useCallback } from "react";
import {
  isSelfTransferTransaction,
  isPrivateTransaction,
} from "@ledgerhq/live-common/families/aleo/utils";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import type { Transaction as AleoTransaction } from "@ledgerhq/live-common/families/aleo/types";
import type { StepProps } from "~/renderer/modals/Send/types";

function getPublicMode(tx: AleoTransaction) {
  const isSelfTransfer = isSelfTransferTransaction(tx);
  const isTokenTx = !!tx.subAccountId;

  if (isTokenTx) {
    return isSelfTransfer
      ? TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE
      : TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC;
  }

  return isSelfTransfer
    ? TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE
    : TRANSACTION_TYPE.TRANSFER_PUBLIC;
}

/**
 * Returns a wrapped `onChangeAccount` that resets any private-mode Aleo transaction back to a
 * structurally valid public mode when the account changes.
 *
 * Background: `useBridgeTransaction.setAccount` calls `bridge.createTransaction()` (which returns
 * a default public tx with no `properties`), then shallow-patches the `mode` from the previous
 * transaction. This leaves TRANSFER_PRIVATE / CONVERT_PRIVATE_TO_PUBLIC without `properties`,
 * causing crashes on anything that reads `transaction.properties.amountRecordCommitments`.
 */
export const useAccountChangeGuard = (
  onChangeAccount: StepProps["onChangeAccount"],
  updateTransaction: StepProps["updateTransaction"],
): StepProps["onChangeAccount"] => {
  return useCallback(
    (nextAccount, nextParentAccount) => {
      onChangeAccount(nextAccount, nextParentAccount);
      updateTransaction(tx => {
        if (tx.family !== "aleo" || !isPrivateTransaction(tx)) return tx;

        const publicMode = getPublicMode(tx);
        const { properties: _drop, ...publicTx } = tx;

        return { ...publicTx, mode: publicMode };
      });
    },
    [onChangeAccount, updateTransaction],
  );
};
