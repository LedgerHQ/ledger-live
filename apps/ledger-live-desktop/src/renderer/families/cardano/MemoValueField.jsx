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
  invariant(transaction.family === "cardano", "Memo: cardano family expected");

  const bridge = getAccountBridge(account);

  const onMemoValueChange = useCallback(
    memo => {
      onChange(
        bridge.updateTransaction(transaction, {
          memo,
        }),
      );
    },
    [onChange, transaction, bridge],
  );

  return (
    <Input
      error={status.errors.memo}
      onChange={onMemoValueChange}
      placeholder={t("families.cardano.memoPlaceholder")}
    />
  );
};

export default MemoValueField;
