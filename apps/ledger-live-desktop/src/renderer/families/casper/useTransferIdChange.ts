import { useCallback } from "react";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import invariant from "invariant";
import type { Transaction } from "@ledgerhq/live-common/families/casper/types";
import type { Account } from "@ledgerhq/types-live";

export function useTransferIdChange(
  account: Account,
  transaction: Transaction,
  onChange: (t: Transaction) => void,
) {
  invariant(transaction.family === "casper", "TransferIdField: casper family expected");

  const bridge = useAccountBridge<Transaction>(account);

  return useCallback(
    (value: string) => {
      const id = value.replace(/\D/g, "");
      onChange(
        bridge.updateTransaction(transaction, {
          transferId: id || undefined,
          memoType: id ? "transferId" : null,
          memoValue: id || null,
        }),
      );
    },
    [onChange, transaction, bridge],
  );
}
