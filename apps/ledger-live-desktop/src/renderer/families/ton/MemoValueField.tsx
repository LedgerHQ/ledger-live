import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/ton/types";
import { Account } from "@ledgerhq/types-live";
import invariant from "invariant";
import React, { useCallback } from "react";
import MemoTagField from "~/newArch/features/MemoTag/components/MemoTagField";

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
  invariant(transaction.family === "ton", "Comment: TON family expected");

  const bridge = getAccountBridge(account);

  const onCommentFieldChange = useCallback(
    (value: string) => {
      onChange(
        bridge.updateTransaction(transaction, {
          comment: { isEncrypted: false, text: value ?? "" },
        }),
      );
    },
    [onChange, transaction, bridge],
  );

  // We use transaction as an error here.
  // on the ledger-live mobile
  return (
    <MemoTagField
      warning={status.warnings.transaction}
      error={status.errors.transaction}
      value={transaction.comment.text}
      onChange={onCommentFieldChange}
    />
  );
};

export default MemoValueField;
