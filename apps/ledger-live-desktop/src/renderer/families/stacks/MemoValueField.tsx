import React, { useCallback } from "react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import invariant from "invariant";
import { Account } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/stacks/types";
import MemoTagField from "LLD/features/MemoTag/components/MemoTagField";

type Props = {
  onChange: (t: Transaction) => void;
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  autoFocus?: boolean;
};

const MemoValueField = ({ onChange, account, transaction, status, autoFocus }: Props) => {
  invariant(transaction.family === "stacks", "MemoField: stacks family expected");

  const bridge = getAccountBridge(account);

  const onMemoValueChange = useCallback(
    (memoValue: string) => {
      onChange(bridge.updateTransaction(transaction, { memo: memoValue }));
    },
    [onChange, transaction, bridge],
  );

  // We use transaction as an error here.
  // It will be usefull to block a memo wrong format
  // on the ledger-live mobile
  return (
    <MemoTagField
      warning={status.warnings.transaction}
      error={status.errors.transaction}
      value={transaction.memo ?? ""}
      onChange={onMemoValueChange}
      autoFocus={autoFocus}
    />
  );
};

export default MemoValueField;
