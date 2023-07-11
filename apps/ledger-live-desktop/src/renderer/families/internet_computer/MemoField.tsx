import React, { useCallback } from "react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import Input from "~/renderer/components/Input";
import invariant from "invariant";
import { Account } from "@ledgerhq/types-live";
import {
  Transaction,
  TransactionStatus,
} from "@ledgerhq/live-common/lib/families/internet_computer/types";
import { useTranslation } from "react-i18next";

const MemoField = ({
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
  invariant(transaction.family === "internet_computer", "Memo: Internet Computer family expected");

  const { t } = useTranslation();

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
    <Input
      warning={status.warnings.transaction}
      error={status.errors.transaction}
      value={transaction.memo ?? ""}
      placeholder={t("families.internet_computer.memoPlaceholder")}
      onChange={onMemoFieldChange}
      spellCheck="false"
    />
  );
};

export default MemoField;
