// @flow
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import Input from "~/renderer/components/Input";
import invariant from "invariant";
import type { Account, Transaction, TransactionStatus } from "@ledgerhq/live-common/types/index";

const MemoValueField = ({
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
  const { t } = useTranslation();
  invariant(transaction.family === "helium", "Memo: helium family expected");

  const bridge = getAccountBridge(account);

  const onMemoValueChange = useCallback(
    memo => {
      onChange(
        bridge.updateTransaction(transaction, {
          model: {
            ...transaction.model,
            memo,
          },
        }),
      );
    },
    [onChange, transaction, bridge],
  );

  return (
    <Input
      error={status.errors.memo}
      value={transaction.model.memo || ""}
      onChange={onMemoValueChange}
      placeholder={t("families.helium.memoPlaceholder")}
    />
  );
};

export default MemoValueField;
