import React, { useCallback } from "react";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import invariant from "invariant";
import { useTranslation } from "react-i18next";
import MemoTagField from "LLD/features/MemoTag/components/MemoTagField";
import { MemoTagFieldProps } from "./types";
import type { Transaction } from "@ledgerhq/live-common/families/casper/types";

const MemoField = ({ onChange, account, transaction, status, autoFocus }: MemoTagFieldProps) => {
  invariant(transaction.family === "casper", "TransferIdField: casper family expected");

  const { t } = useTranslation();

  const bridge = useAccountBridge<Transaction>(account);

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
