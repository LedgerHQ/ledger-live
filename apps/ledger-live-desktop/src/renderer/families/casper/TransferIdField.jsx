// @flow

import React, { useCallback } from "react";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import Input from "~/renderer/components/Input";
import invariant from "invariant";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction, TransactionStatus } from "@ledgerhq/live-common/families/casper/types";
import { useTranslation } from "react-i18next";

const TranferIdField = ({
  onChange,
  account,
  transaction,
  status,
}: {
  onChange: string => void,
  account: Account,
  transaction: Transaction,
  status: TransactionStatus,
}) => {
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

  // We use transaction as an error here.
  // on the ledger-live mobile
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

export default TranferIdField;
