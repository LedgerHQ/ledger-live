import React, { useCallback } from "react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import invariant from "invariant";
import {
  CardanoAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cardano/types";
import { track } from "~/renderer/analytics/segment";
import MemoTagField from "LLD/features/MemoTag/components/MemoTagField";

const MemoValueField = ({
  onChange,
  account,
  transaction,
  status,
  trackProperties,
  autoFocus,
}: {
  onChange: (a: Transaction) => void;
  account: CardanoAccount;
  transaction: Transaction;
  status: TransactionStatus;
  trackProperties?: Record<string, unknown>;
  autoFocus?: boolean;
}) => {
  invariant(transaction.family === "cardano", "Memo: cardano family expected");
  const bridge = getAccountBridge(account);
  const onMemoValueChange = useCallback(
    (memo: string) => {
      track("button_clicked2", {
        ...trackProperties,
        button: "input",
        memo,
      });
      onChange(
        bridge.updateTransaction(transaction, {
          memo,
        }),
      );
    },
    [trackProperties, onChange, bridge, transaction],
  );
  return (
    <MemoTagField
      error={status.errors.memo}
      onChange={onMemoValueChange}
      autoFocus={autoFocus}
      value={transaction.memo ?? ""}
    />
  );
};
export default MemoValueField;
