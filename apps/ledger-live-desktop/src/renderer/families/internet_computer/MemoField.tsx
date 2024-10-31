import React, { useCallback } from "react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import invariant from "invariant";
import { Account } from "@ledgerhq/types-live";
import {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/internet_computer/types";
import MemoTagField from "LLD/features/MemoTag/components/MemoTagField";

const MemoField = ({
  onChange,
  account,
  transaction,
  status,
  autoFocus,
}: {
  onChange: (a: Transaction) => void;
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
  autoFocus?: boolean;
}) => {
  invariant(transaction.family === "internet_computer", "Memo: Internet Computer family expected");

  const bridge = getAccountBridge(account);

  const onMemoFieldChange = useCallback(
    (value: string) => {
      if (value !== "") onChange(bridge.updateTransaction(transaction, { memo: value }));
      else onChange(bridge.updateTransaction(transaction, { memo: undefined }));
    },
    [onChange, transaction, bridge],
  );

  // We use transaction as an error here.
  // on the ledger-live mobile
  return (
    <MemoTagField
      warning={status.warnings.transaction}
      error={status.errors.transaction}
      value={transaction.memo ?? ""}
      onChange={onMemoFieldChange}
      spellCheck="false"
      autoFocus={autoFocus}
    />
  );
};

export default MemoField;
