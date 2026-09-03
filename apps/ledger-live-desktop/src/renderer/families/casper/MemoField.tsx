import React from "react";
import invariant from "invariant";
import { useTranslation } from "react-i18next";
import MemoTagField from "LLD/features/MemoTag/components/MemoTagField";
import { MemoTagFieldProps } from "./types";
import { useTransferIdChange } from "./hooks";

const MemoField = ({ onChange, account, transaction, status, autoFocus }: MemoTagFieldProps) => {
  invariant(transaction.family === "casper", "MemoField: casper family expected");

  const { t } = useTranslation();

  const onTransferIdFieldChange = useTransferIdChange(account, transaction, onChange);

  return (
    <MemoTagField
      warning={status.warnings.transaction}
      error={status.errors.transaction || status.errors.sender}
      value={transaction.transferId ?? ""}
      placeholder={t("families.casper.transferIdPlaceholder")}
      label={t("families.casper.transferId")}
      tooltipText={t("families.casper.transferIdWarningText")}
      onChange={onTransferIdFieldChange}
      spellCheck="false"
      autoFocus={autoFocus}
    />
  );
};

export default MemoField;
