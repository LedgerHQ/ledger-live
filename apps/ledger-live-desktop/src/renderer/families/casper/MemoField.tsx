import React, { useCallback } from "react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import invariant from "invariant";
import { useTranslation } from "react-i18next";
import MemoTagField from "~/newArch/features/MemoTag/components/MemoTagField";
import { MemoTagFieldProps } from "./types";

const MemoField = ({ onChange, account, transaction, status, autoFocus }: MemoTagFieldProps) => {
  invariant(transaction.family === "casper", "TransferIdField: casper family expected");

  const { t } = useTranslation();

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
