import React from "react";
import Input from "~/renderer/components/Input";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/casper/types";
import { useTranslation } from "react-i18next";
import { useTransferIdChange } from "./useTransferIdChange";

const TransferIdField = ({
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
  const { t } = useTranslation();

  const onTransferIdFieldChange = useTransferIdChange(account, transaction, onChange);

  return (
    <Input
      warning={status.warnings.transaction}
      error={status.errors.transaction}
      value={transaction.memoValue ?? ""}
      placeholder={t("families.casper.transferIdPlaceholder")}
      onChange={onTransferIdFieldChange}
      spellCheck="false"
    />
  );
};

export default TransferIdField;
