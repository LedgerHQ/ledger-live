import React from "react";
import Input from "~/renderer/components/Input";
import invariant from "invariant";
import { useTranslation } from "react-i18next";
import { TransferIdProps } from "./types";
import { useTransferIdChange } from "./hooks";

const TransferIdField = ({ onChange, account, transaction, status }: TransferIdProps) => {
  invariant(transaction.family === "casper", "TransferIdField: casper family expected");

  const { t } = useTranslation();

  const onTransferIdFieldChange = useTransferIdChange(account, transaction, onChange);

  return (
    <Input
      warning={status.warnings.transaction}
      error={status.errors.transaction}
      value={transaction.transferId ?? ""}
      placeholder={t("families.casper.transferIdPlaceholder")}
      onChange={onTransferIdFieldChange}
      spellCheck="false"
    />
  );
};

export default TransferIdField;
