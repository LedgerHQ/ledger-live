import { useCallback } from "react";
import {
  isSelfTransferTransaction,
  isPrivateTransaction,
} from "@ledgerhq/live-common/families/aleo/utils";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import type { StepProps } from "~/renderer/modals/Send/types";

/**
 * Returns a wrapped `onChangeAccount` that resets any private-mode Aleo transaction back to a
 * structurally valid public mode when the account changes.
 *
 * Background: `useBridgeTransaction.setAccount` calls `bridge.createTransaction()` (which returns
 * a default public tx with no `properties`), then shallow-patches the `mode` from the previous
 * transaction. This leaves TRANSFER_PRIVATE / CONVERT_PRIVATE_TO_PUBLIC without `properties`,
 * causing crashes on anything that reads `transaction.properties.amountRecordCommitment`.
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
        const defaultMode = isSelfTransferTransaction(tx)
          ? TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE
          : TRANSACTION_TYPE.TRANSFER_PUBLIC;
        const { properties: _drop, ...publicTx } = tx;
        return { ...publicTx, mode: defaultMode };
      });
    },
    [onChangeAccount, updateTransaction],
  );
};
