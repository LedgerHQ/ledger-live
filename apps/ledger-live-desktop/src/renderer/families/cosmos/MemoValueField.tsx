import React, { useCallback } from "react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import invariant from "invariant";
import {
  CosmosAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/cosmos/types";
import MemoTagField from "LLD/features/MemoTag/components/MemoTagField";
const MemoValueField = ({
  onChange,
  account,
  transaction,
  status,
  autoFocus,
}: {
  onChange: (transaction: Transaction) => void;
  account: CosmosAccount;
  transaction: Transaction;
  status: TransactionStatus;
  autoFocus?: boolean;
}) => {
  invariant(transaction.family === "cosmos", "MemoTypeField: cosmos family expected");
  const bridge = getAccountBridge(account);
  const onMemoValueChange = useCallback(
    (memo: string) => {
      onChange(
        bridge.updateTransaction(transaction, {
          memo,
        }),
      );
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
