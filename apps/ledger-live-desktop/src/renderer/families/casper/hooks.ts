import { useCallback } from "react";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type { Transaction } from "@ledgerhq/live-common/families/casper/types";
import type { Account } from "@ledgerhq/types-live";

export function useTransferIdChange(
  account: Account,
  transaction: Transaction,
  onChange: (t: Transaction) => void,
) {
  const bridge = useAccountBridge<Transaction>(account);

  return useCallback(
    (value: string) => {
      value = value.replace(/\D/g, "");
      // Cleared state mirrors descriptor/send/memo.ts casper handler — keep in sync.
      onChange(
        bridge.updateTransaction(transaction, {
          transferId: value || undefined,
          memoType: value ? "transferId" : null,
          memoValue: value || null,
        }),
      );
    },
    [onChange, transaction, bridge],
  );
}
