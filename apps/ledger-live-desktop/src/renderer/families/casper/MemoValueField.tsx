import React, { useCallback } from "react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import invariant from "invariant";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/casper/types";
import MemoTagField from "~/newArch/features/MemoTag/components/MemoTagField";

const MemoValueField = ({
  onChange,
  account,
  transaction,
  status,
}: {
  onChange: (t: Transaction) => void;
  account: Account;
  transaction: Transaction;
  status: TransactionStatus;
}) => {
  invariant(transaction.family === "casper", "TransferIdField: casper family expected");

  const bridge = getAccountBridge(account);

  const onTransferIdFieldChange = useCallback(
    (value: string) => {
      value = value.replace(/\D/g, "");
      if (value !== "") onChange(bridge.updateTransaction(transaction, { transferId: value }));
      else onChange(bridge.updateTransaction(transaction, { transferId: undefined }));
    },
    [onChange, transaction, bridge],
  );

  return (
    <MemoTagField
      warning={status.warnings.transaction}
      error={status.errors.transaction}
      value={transaction.transferId ?? ""}
      onChange={onTransferIdFieldChange}
    />
  );
};

export default MemoValueField;
