import React from "react";
import { useTranslation } from "react-i18next";
import MemoTagField from "LLD/features/MemoTag/components/MemoTagField";
import { MemoTagFieldProps } from "./types";
import { useTransferIdChange } from "./useTransferIdChange";

const MemoField = ({ onChange, account, transaction, status, autoFocus }: MemoTagFieldProps) => {
  const { t } = useTranslation();

  const onTransferIdFieldChange = useTransferIdChange(account, transaction, onChange);

  return (
    <MemoTagField
      warning={status.warnings.transaction}
      error={status.errors.transaction || status.errors.sender}
      value={transaction.memoValue ?? ""}
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
