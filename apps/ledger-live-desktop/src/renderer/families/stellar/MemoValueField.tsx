import React, { useCallback } from "react";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import Input from "~/renderer/components/Input";
import { Account } from "@ledgerhq/types-live";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/stellar/types";

const MemoValueField = ({
  onChange,
  account,
  transaction,
  status,
}: {
  onChange: (a: Transaction) => void;
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
}) => {
  const bridge = useAccountBridge<Transaction>(account);
  const onMemoValueChange = useCallback(
    (memoValue: string) => {
      onChange(bridge.updateTransaction(transaction, { memoValue }));
    },
    [onChange, transaction, bridge],
  );

  // We use transaction as an error here.
  // It will be usefull to block a memo wrong format
  // on the ledger-live mobile
  return (
    <Input
      warning={status.warnings.transaction}
      error={status.errors.transaction}
      value={transaction.memoValue || ""}
      onChange={onMemoValueChange}
      spellCheck="false"
    />
  );
};
export default MemoValueField;
