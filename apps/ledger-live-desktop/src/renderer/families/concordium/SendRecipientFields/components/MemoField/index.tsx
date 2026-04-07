import { MAX_MEMO_LENGTH } from "@ledgerhq/coin-concordium/constants";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/concordium/types";
import { Account } from "@ledgerhq/types-live";
import MemoTagField from "LLD/features/MemoTag/components/MemoTagField";
import React, { useCallback } from "react";
import { track } from "~/renderer/analytics/segment";

type Props = {
  account: Account;
  transaction: Transaction;
  onChange: (t: Transaction) => void;
  status: TransactionStatus;
  trackProperties?: Record<string, unknown>;
  autoFocus?: boolean;
};

const MemoField = ({
  account,
  transaction,
  onChange,
  status,
  trackProperties = {},
  autoFocus,
}: Props) => {
  const onMemoChange = useCallback(
    async (memo: string) => {
      const bridge = await getAccountBridge(account);
      track("button_clicked2", {
        ...trackProperties,
        button: "input",
        memo,
      });
      onChange(bridge.updateTransaction(transaction, { memo }));
    },
    [trackProperties, onChange, account, transaction],
  );

  return (
    <MemoTagField
      maxLength={MAX_MEMO_LENGTH}
      error={status.errors.memo}
      value={transaction.memo ?? ""}
      onChange={onMemoChange}
      autoFocus={autoFocus}
    />
  );
};

export default MemoField;
