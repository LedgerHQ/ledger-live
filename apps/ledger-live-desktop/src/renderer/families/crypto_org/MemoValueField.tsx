import React, { useCallback } from "react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import {
  CryptoOrgAccount,
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/families/crypto_org/types";
import MemoTagField from "LLD/features/MemoTag/components/MemoTagField";

const MemoValueField = ({
  onChange,
  account,
  transaction,
  status,
  autoFocus,
}: {
  onChange: (t: Transaction) => void;
  account: CryptoOrgAccount;
  transaction: Transaction;
  status: TransactionStatus;
  autoFocus?: boolean;
}) => {
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
